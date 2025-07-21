// src/pages/dancers/show.tsx
import { useShow, useNavigation, useGetIdentity, useList } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Music,
  MessageCircle,
  Trophy,
  Target,
  Eye,
  EyeOff,
  Star,
  Users,
  DollarSign
} from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Badge, Button, Separator } from "@/components/ui";
import { useLoading } from "@/utility";
import { DancerLikeButton } from "./DancerLikeButton";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Dancer, UserIdentity } from "./dancers";
import { Event } from "../events/events";

interface InstructorStats {
  totalEvents: number;
  upcomingEvents: number;
  totalStudents: number;
  averagePrice: number;
}

export const DancersShow = () => {
  const { data: identity } = useGetIdentity<UserIdentity>();
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [instructorStats, setInstructorStats] = useState<InstructorStats>({
    totalEvents: 0,
    upcomingEvents: 0,
    totalStudents: 0,
    averagePrice: 0
  });
  
  const { queryResult } = useShow<Dancer>({
    meta: {
      select: `*, 
        dancer_dance_styles(
          skill_level, 
          years_experience,
          is_teaching,
          dance_styles(name, category)
        ),
        users!dancers_user_id_fkey(id, email)`
    }
  });
  
  const { list } = useNavigation();

  const { data, isLoading, isError } = queryResult;
  const record = data?.data;

  // Pobierz nadchodzące wydarzenia trenera
  const { data: trainerEvents } = useList<Event>({
    resource: "events",
    filters: [
      {
        field: "organizer_id",
        operator: "eq",
        value: record?.users?.id || "",
      },
      {
        field: "start_datetime",
        operator: "gte",
        value: new Date().toISOString(),
      },
      {
        field: "status",
        operator: "eq",
        value: "active",
      },
    ],
    meta: {
      select: '*, dance_styles(name)',
    },
    pagination: {
      pageSize: 5,
    },
    sorters: [
      {
        field: "start_datetime",
        order: "asc",
      },
    ],
    queryOptions: {
      enabled: !!record?.users?.id && !!record?.dancer_dance_styles?.some((ds) => ds.is_teaching),
    },
  });

  // Oblicz statystyki instruktora
  useEffect(() => {
    const calculateInstructorStats = async () => {
      if (!record?.users?.id || !record?.dancer_dance_styles?.some((ds) => ds.is_teaching)) return;

      try {
        const { supabaseClient } = await import("@/utility");
        
        // Wszystkie wydarzenia
        const { count: totalEvents } = await supabaseClient
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('organizer_id', record.users.id);

        // Nadchodzące wydarzenia
        const { count: upcomingEvents } = await supabaseClient
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('organizer_id', record.users.id)
          .gte('start_datetime', new Date().toISOString())
          .eq('status', 'active');

        // Unikalni studenci
        const { data: participants } = await supabaseClient
          .from('event_participants')
          .select('participant_id')
          .in('event_type', ['lesson', 'workshop'])
          .neq('participant_id', record.users.id);

        const uniqueStudents = new Set(participants?.map(p => p.participant_id) || []);

        // Średnia cena
        const { data: prices } = await supabaseClient
          .from('events')
          .select('price_amount')
          .eq('organizer_id', record.users.id)
          .not('price_amount', 'is', null);

        const avgPrice = prices && prices.length > 0 
          ? prices.reduce((sum, p) => sum + (p.price_amount || 0), 0) / prices.length
          : 0;

        setInstructorStats({
          totalEvents: totalEvents || 0,
          upcomingEvents: upcomingEvents || 0,
          totalStudents: uniqueStudents.size,
          averagePrice: Math.round(avgPrice)
        });
      } catch (error) {
        console.error("Error calculating instructor stats:", error);
      }
    };

    calculateInstructorStats();
  }, [record]);

  const init = useLoading({ isLoading, isError });
  if (init) return init;

  if (!record) {
    return (
      <div className="p-6 mx-auto">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Profil nie znaleziony</p>
          <Button className="mt-4" onClick={() => list("dancers")}>
            Powrót do listy
          </Button>
        </div>
      </div>
    );
  }

  // Oblicz wiek
  const age = record.birth_date ? 
    Math.floor((new Date().getTime() - new Date(record.birth_date).getTime()) / 31557600000) : 
    null;

  // Wyciągnij style tańca
  const danceStyles = record.dancer_dance_styles?.map((ds) => ({
    name: ds.dance_styles?.name,
    category: ds.dance_styles?.category,
    level: ds.skill_level,
    yearsExperience: ds.years_experience,
    isTeaching: ds.is_teaching
  })).filter((ds) => ds.name) || [];

  // Sprawdź czy to własny profil
  const isOwnProfile = identity?.id === record.user_id;
  
  // Sprawdź czy to instruktor
  const isInstructor = danceStyles.some((s) => s.isTeaching);

  // Mapowanie poziomów
  const getSkillLevelLabel = (level: string) => {
    const levels: Record<string, string> = {
      beginner: 'Początkujący',
      intermediate: 'Średniozaawansowany',
      advanced: 'Zaawansowany',
      professional: 'Profesjonalny'
    };
    return levels[level] || level;
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => list("dancers")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Powrót do listy
      </Button>

      <FlexBox>
        <Lead
          title={record.name}
          description={isInstructor ? "Instruktor tańca" : "Profil tancerza"}
        />
        {!isOwnProfile && (
          <FlexBox className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowContactOptions(!showContactOptions)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Kontakt
            </Button>
            <DancerLikeButton targetDancerId={record.id} />
          </FlexBox>
        )}
      </FlexBox>

      {/* Contact Options */}
      {showContactOptions && !isOwnProfile && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Opcje kontaktu będą dostępne po wzajemnym dopasowaniu
            </p>
            <Button 
              className="w-full" 
              disabled
            >
              Czat dostępny po dopasowaniu
            </Button>
          </CardContent>
        </Card>
      )}

      <GridBox>
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Photo and Basic Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={record.profile_photo_url} />
                  <AvatarFallback className="text-4xl">{record.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {record.name}{record.show_age !== false && age ? `, ${age}` : ""}
                    </h2>
                    {record.show_exact_location !== false && (
                      <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4" />
                        {record.city || record.location_address || "Nieznane"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {record.visibility && (
                      <Badge variant={record.visibility === 'public' ? 'default' : 'secondary'}>
                        {record.visibility === 'public' ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Profil publiczny
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Profil prywatny
                          </>
                        )}
                      </Badge>
                    )}
                    {isInstructor && (
                      <Badge variant="default" className="bg-green-600">
                        <Trophy className="w-3 h-3 mr-1" />
                        Instruktor
                      </Badge>
                    )}
                    {record.is_active === false && (
                      <Badge variant="destructive">Nieaktywny</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          {record.bio && (
            <Card>
              <CardHeader>
                <CardTitle>O mnie</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {record.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Dance Styles */}
          {danceStyles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Style tańca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {danceStyles.map((style, index) => (
                    <div key={index} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge>{style.name}</Badge>
                        {style.category && (
                          <span className="text-xs text-muted-foreground">
                            {style.category}
                          </span>
                        )}
                        {style.isTeaching && (
                          <Badge variant="outline" className="ml-auto">
                            <Trophy className="w-3 h-3 mr-1" />
                            Nauczam
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Poziom: <span className="font-medium text-foreground">
                            {getSkillLevelLabel(style.level)}
                          </span>
                        </span>
                        {style.yearsExperience && style.yearsExperience > 0 && (
                          <span className="text-muted-foreground">
                            Doświadczenie: <span className="font-medium text-foreground">
                              {style.yearsExperience} {style.yearsExperience === 1 ? 'rok' : style.yearsExperience < 5 ? 'lata' : 'lat'}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events - tylko dla instruktorów */}
          {isInstructor && trainerEvents?.data && trainerEvents.data.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Nadchodzące zajęcia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trainerEvents.data.map((event) => (
                    <div key={event.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.start_datetime), "EEEE, d MMMM", { locale: pl })}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {format(new Date(event.start_datetime), "HH:mm")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {event.dance_styles && (
                          <div className="flex items-center gap-1">
                            <Music className="w-3 h-3" />
                            <span>{event.dance_styles.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>
                            {event.current_participants}
                            {event.max_participants && `/${event.max_participants}`}
                          </span>
                        </div>
                        {event.price_amount !== null && event.price_amount !== undefined && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>
                              {event.price_amount === 0 ? 'Bezpłatne' : `${event.price_amount} PLN`}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2 w-full"
                        onClick={() => window.location.href = `/events/show/${event.id}`}
                      >
                        Zobacz szczegóły
                      </Button>
                    </div>
                  ))}
                </div>
                <Button 
                  className="w-full mt-4" 
                  variant="default"
                  onClick={() => window.location.href = `/events?organizer=${record.users?.id}`}
                >
                  Zobacz wszystkie zajęcia
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          {!isOwnProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Akcje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <DancerLikeButton 
                  targetDancerId={record.id} 
                  className="w-full"
                />
                <Button 
                  className="w-full" 
                  variant="outline" 
                  disabled
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Czat (po dopasowaniu)
                </Button>
                {isInstructor && (
                  <Button 
                    className="w-full" 
                    variant="default"
                    onClick={() => window.location.href = `/events?organizer=${record.users?.id}`}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Zobacz zajęcia
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructor Stats - jeśli jest instruktorem */}
          {isInstructor && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Statystyki instruktora
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Wydarzenia</span>
                    <span className="font-medium">{instructorStats.totalEvents}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Nadchodzące</span>
                    <span className="font-medium">{instructorStats.upcomingEvents}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Uczniów</span>
                    <span className="font-medium">{instructorStats.totalStudents}</span>
                  </div>
                  {instructorStats.averagePrice > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Średnia cena</span>
                      <span className="font-medium">{instructorStats.averagePrice} PLN</span>
                    </div>
                  )}
                </div>
                
                {/* TODO: Oceny */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="w-4 h-4" />
                    <span>Oceny wkrótce dostępne</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informacje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {record.search_radius_km && (
                  <>
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Zasięg poszukiwań</p>
                        <p className="text-sm text-muted-foreground">
                          {record.search_radius_km} km
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Dołączył</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.created_at).toLocaleDateString("pl-PL", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teaching Info - jeśli jest instruktorem */}
          {isInstructor && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Prowadzę zajęcia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {danceStyles
                    .filter((s) => s.isTeaching)
                    .map((style, idx) => (
                      <Badge key={idx} variant="secondary">
                        {style.name}
                      </Badge>
                    ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Kontakt przez system dopasowań lub bezpośrednio na zajęciach
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </GridBox>
    </>
  );
};