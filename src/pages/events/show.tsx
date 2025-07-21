// src/pages/events/show.tsx
import { useShow, useNavigation, useGetIdentity, useCreate, useList } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Music,
  User,
  School,
  CheckCircle,
  Info,
  Share2,
  Heart
} from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Badge, Button, Separator } from "@/components/ui";
import { useLoading } from "@/utility";
import { format, differenceInMinutes } from "date-fns";
import { pl } from "date-fns/locale";
import { useState, useEffect } from "react";
import { Event, EventParticipant } from "./events";
import { UserIdentity } from "../dancers/dancers";

export const EventsShow = () => {
  const { data: identity } = useGetIdentity<UserIdentity>();
  const { list, edit } = useNavigation();
  const { mutate: bookEvent, isLoading: isBooking } = useCreate<EventParticipant>();
  const [isBooked, setIsBooked] = useState(false);
  
  const { queryResult } = useShow<Event>({
    meta: {
      select: `*, 
        users!events_organizer_id_fkey(
          id,
          email,
          dancers(id, name, profile_photo_url, bio),
          dance_schools(id, name, logo_url, description)
        ),
        dance_styles(name, category)`
    }
  });

  const { data, isLoading, isError } = queryResult;
  const record = data?.data;

  // Pobierz uczestników wydarzenia
  const { data: participantsData } = useList<EventParticipant>({
    resource: "event_participants",
    filters: [
      {
        field: "event_id",
        operator: "eq",
        value: record?.id || "",
      },
    ],
    queryOptions: {
      enabled: !!record?.id,
    },
  });

  const eventParticipants = participantsData?.data || [];

  const init = useLoading({ isLoading, isError });
  if (init) return init;

  if (!record) {
    return (
      <div className="p-6 mx-auto">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Wydarzenie nie znalezione</p>
          <Button className="mt-4" onClick={() => list("events")}>
            Powrót do listy
          </Button>
        </div>
      </div>
    );
  }

  // Sprawdź czy użytkownik jest już zapisany
  const userParticipation = eventParticipants.find(
    (p) => p.participant_id === identity?.id
  );

  const isOrganizer = record.organizer_id === identity?.id;
  const spotsLeft = record.max_participants ? 
    record.max_participants - record.current_participants : null;
  const isFull = spotsLeft === 0;

  // Pobierz info o organizatorze
  const getOrganizerInfo = () => {
    const user = record.users;
    if (!user) return null;
    
    if (user.dancers && user.dancers.length > 0) {
      return {
        type: 'dancer' as const,
        ...user.dancers[0]
      };
    } else if (user.dance_schools && user.dance_schools.length > 0) {
      return {
        type: 'school' as const,
        ...user.dance_schools[0]
      };
    }
    
    return null;
  };

  const organizer = getOrganizerInfo();

  const handleBooking = () => {
    if (!identity) {
      alert("Musisz być zalogowany, aby zapisać się na wydarzenie");
      return;
    }

    bookEvent(
      {
        resource: "event_participants",
        values: {
          event_id: record.id,
          event_type: record.event_category,
          participant_id: identity.id,
          status: "registered",
        },
      },
      {
        onSuccess: () => {
          setIsBooked(true);
          alert("Zapisano na wydarzenie!");
          // Odśwież dane
          queryResult.refetch();
        },
        onError: (error) => {
          console.error("Booking error:", error);
          alert("Nie udało się zapisać na wydarzenie");
        },
      }
    );
  };

  const getDuration = () => {
    const minutes = differenceInMinutes(
      new Date(record.end_datetime),
      new Date(record.start_datetime)
    );
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => list("events")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Powrót do listy
      </Button>

      <FlexBox>
        <Lead
          title={record.title}
          description={getEventCategoryLabel(record.event_category)}
        />
        {isOrganizer && (
          <Button onClick={() => edit("events", record.id)}>
            Edytuj wydarzenie
          </Button>
        )}
      </FlexBox>

      <GridBox>
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Szczegóły wydarzenia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date and Time */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Data</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(record.start_datetime), "EEEE, d MMMM yyyy", { locale: pl })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Godzina</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(record.start_datetime), "HH:mm")} - 
                      {format(new Date(record.end_datetime), "HH:mm")}
                      <span className="ml-1">({getDuration()})</span>
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Lokalizacja</p>
                  {record.location_type === 'online' ? (
                    <div>
                      <p className="text-sm text-muted-foreground">Wydarzenie online</p>
                      {record.online_platform && (
                        <Badge variant="secondary" className="mt-1">
                          {record.online_platform}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div>
                      {record.location_name && (
                        <p className="text-sm font-medium">{record.location_name}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {record.address}
                        {record.city && `, ${record.city}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dance Style & Level */}
              {(record.dance_styles || record.skill_level_required) && (
                <>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    {record.dance_styles && (
                      <div className="flex items-center gap-3">
                        <Music className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Styl tańca</p>
                          <Badge variant="secondary" className="mt-1">
                            {record.dance_styles.name}
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    {record.skill_level_required && (
                      <div>
                        <p className="font-medium">Wymagany poziom</p>
                        <p className="text-sm text-muted-foreground">
                          {getSkillLevelLabel(record.skill_level_required)}
                          {record.skill_level_max && ` - ${getSkillLevelLabel(record.skill_level_max)}`}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Participants */}
              <Separator />
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">Uczestnicy</p>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                      {record.current_participants} zapisanych
                      {record.max_participants && ` / ${record.max_participants} miejsc`}
                    </p>
                    {spotsLeft !== null && spotsLeft > 0 && (
                      <Badge variant="outline" className="text-green-600">
                        {spotsLeft} {spotsLeft === 1 ? 'miejsce' : spotsLeft < 5 ? 'miejsca' : 'miejsc'}
                      </Badge>
                    )}
                    {isFull && (
                      <Badge variant="destructive">Brak miejsc</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Requirements */}
              {(record.requires_partner || record.age_min || record.requirements?.length > 0) && (
                <>
                  <Separator />
                  <div>
                    <p className="font-medium mb-2">Wymagania</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {record.requires_partner && (
                        <li>• Wymagany partner do zapisu</li>
                      )}
                      {record.provides_partner && (
                        <li>• Organizator zapewnia partnera</li>
                      )}
                      {record.age_min && (
                        <li>• Wiek: {record.age_min}{record.age_max && `-${record.age_max}`} lat</li>
                      )}
                      {record.requirements?.map((req, idx) => (
                        <li key={idx}>• {req}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {record.description && (
            <Card>
              <CardHeader>
                <CardTitle>Opis wydarzenia</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{record.description}</p>
              </CardContent>
            </Card>
          )}

          {/* What to expect */}
          {record.what_to_expect && (
            <Card>
              <CardHeader>
                <CardTitle>Czego się spodziewać</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{record.what_to_expect}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booking Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Zapisy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price */}
              {record.price_amount ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {record.price_amount} {record.price_currency || 'PLN'}
                    </span>
                    {record.price_per && (
                      <span className="text-sm text-muted-foreground">
                        / {record.price_per === 'person' ? 'osoba' : 
                           record.price_per === 'couple' ? 'para' : 
                           record.price_per === 'hour' ? 'godzina' : 
                           record.price_per}
                      </span>
                    )}
                  </div>
                  {record.early_bird_discount && record.early_bird_deadline && 
                   new Date(record.early_bird_deadline) > new Date() && (
                    <Badge variant="secondary" className="mt-2">
                      -{record.early_bird_discount}% do {format(new Date(record.early_bird_deadline), "d MMM", { locale: pl })}
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <Badge variant="secondary" className="text-lg py-2">
                    Wydarzenie bezpłatne
                  </Badge>
                </div>
              )}

              {/* Book Button */}
              {!isOrganizer && (
                <>
                  {userParticipation ? (
                    <div className="space-y-2">
                      <Button className="w-full" disabled>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Jesteś zapisany
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Status: {userParticipation.status}
                      </p>
                    </div>
                  ) : (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleBooking}
                      disabled={isFull || isBooking || !identity}
                    >
                      {!identity ? "Zaloguj się aby się zapisać" :
                       isFull ? "Brak miejsc" :
                       isBooking ? "Zapisywanie..." :
                       "Zapisz się"}
                    </Button>
                  )}
                </>
              )}

              {/* Share */}
              <Button variant="outline" className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Udostępnij
              </Button>
            </CardContent>
          </Card>

          {/* Organizer Card */}
          {organizer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {organizer.type === 'dancer' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <School className="w-4 h-4" />
                  )}
                  Organizator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar>
                    <AvatarImage src={organizer.profile_photo_url || organizer.logo_url} />
                    <AvatarFallback>{organizer.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{organizer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {organizer.type === 'dancer' ? 'Instruktor' : 'Szkoła tańca'}
                    </p>
                  </div>
                </div>
                
                {(organizer.bio || organizer.description) && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {organizer.bio || organizer.description}
                  </p>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    if (organizer.type === 'dancer') {
                      window.location.href = `/dancers/show/${organizer.id}`;
                    } else {
                      // TODO: Navigate to school profile
                      console.log('Navigate to school profile:', organizer.id);
                    }
                  }}
                >
                  Zobacz profil
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {record.tags && record.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tagi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {record.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cancellation Policy */}
          {record.cancellation_policy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Polityka anulowania</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {record.cancellation_policy}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </GridBox>
    </>
  );
};

// Helper functions
function getEventCategoryLabel(category: string) {
  const categories: Record<string, string> = {
    lesson: 'Lekcja',
    workshop: 'Warsztaty',
    outdoor: 'Plener',
    party: 'Impreza',
    course: 'Kurs'
  };
  return categories[category] || category;
}

function getSkillLevelLabel(level: string) {
  const levels: Record<string, string> = {
    beginner: 'Początkujący',
    intermediate: 'Średniozaawansowany',
    advanced: 'Zaawansowany',
    professional: 'Profesjonalny'
  };
  return levels[level] || level;
}