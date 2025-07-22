// src/pages/dancers/show.tsx
import { useShow, useNavigation, useGetIdentity, useList } from "@refinedev/core";
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
  DollarSign,
  Heart,
  Share2,
  Clock,
  Award,
  Sparkles,
  Instagram,
  Facebook,
  Mail,
  Phone,
  Globe,
  CheckCircle,
  Activity
} from "lucide-react";
import { Badge, Button, Separator } from "@/components/ui";
import { useLoading } from "@/utility";
import { DancerLikeButton } from "./DancerLikeButton";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Dancer, UserIdentity } from "./dancers";
import { Event } from "../events/events";
import { cn } from "@/utility";

interface InstructorStats {
  totalEvents: number;
  upcomingEvents: number;
  totalStudents: number;
  averagePrice: number;
}

export const DancersShow = () => {
  const { data: identity } = useGetIdentity<UserIdentity>();
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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
        users!dancers_user_id_fkey(id, email),
        dancer_photos(photo_url, thumbnail_url, caption, order_index)`
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
      pageSize: 6,
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
        
        const { count: totalEvents } = await supabaseClient
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('organizer_id', record.users.id);

        const { count: upcomingEvents } = await supabaseClient
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('organizer_id', record.users.id)
          .gte('start_datetime', new Date().toISOString())
          .eq('status', 'active');

        const { data: participants } = await supabaseClient
          .from('event_participants')
          .select('participant_id')
          .in('event_type', ['lesson', 'workshop'])
          .neq('participant_id', record.users.id);

        const uniqueStudents = new Set(participants?.map(p => p.participant_id) || []);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Profil nie znaleziony</h3>
          <p className="text-gray-500 mb-4">
            Nie udało się znaleźć profilu tancerza
          </p>
          <Button onClick={() => list("dancers")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
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

  // Zdjęcia
  const photos = record.dancer_photos?.sort((a, b) => a.order_index - b.order_index) || [];
  const allPhotos = [
    { photo_url: record.profile_photo_url, caption: "Zdjęcie profilowe" },
    ...photos
  ].filter(p => p.photo_url);

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

  const getSkillLevelIcon = (level: string) => {
    const icons: Record<string, JSX.Element> = {
      beginner: <div className="w-2 h-2 bg-green-500 rounded-full" />,
      intermediate: <div className="w-2 h-2 bg-blue-500 rounded-full" />,
      advanced: <div className="w-2 h-2 bg-purple-500 rounded-full" />,
      professional: <div className="w-2 h-2 bg-orange-500 rounded-full" />
    };
    return icons[level] || <div className="w-2 h-2 bg-gray-500 rounded-full" />;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Simplified Header */}
      <div className="border-b bg-gray-50/50">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => list("dancers")}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót
          </Button>
        </div>
      </div>

      {/* Main Profile Section */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Photo Gallery */}
          <div className="lg:col-span-5">
            <div className="sticky top-8">
              {allPhotos.length > 0 ? (
                <div className="space-y-4">
                  {/* Main Photo */}
                  <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100">
                    <img
                      src={allPhotos[selectedImageIndex]?.photo_url}
                      alt={record.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder-dancer.jpg";
                      }}
                    />
                  </div>
                  
                  {/* Thumbnails */}
                  {allPhotos.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {allPhotos.map((photo, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={cn(
                            "w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 transition-all",
                            selectedImageIndex === idx 
                              ? "ring-2 ring-purple-500 ring-offset-2" 
                              : "opacity-70 hover:opacity-100"
                          )}
                        >
                          <img
                            src={photo.photo_url}
                            alt={`Zdjęcie ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[4/5] bg-gray-100 rounded-2xl flex items-center justify-center">
                  <Avatar className="w-32 h-32">
                    <AvatarFallback className="text-4xl bg-gray-200">
                      {record.name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="lg:col-span-7 space-y-8">
            {/* Header Info */}
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {record.name}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-600">
                    {record.show_age !== false && age && (
                      <span className="text-lg">{age} lat</span>
                    )}
                    {record.show_exact_location !== false && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {record.city || record.location_address || "Nieznane"}
                        </span>
                      </>
                    )}
                    {record.search_radius_km && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {record.search_radius_km} km
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Status Badges */}
                <div className="flex items-center gap-2">
                  {isInstructor && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <Trophy className="w-4 h-4" />
                      Instruktor
                    </div>
                  )}
                  {record.is_active && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      <Activity className="w-4 h-4" />
                      Aktywny
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && (
                <div className="flex flex-wrap gap-3">
                  <DancerLikeButton 
                    targetDancerId={record.id}
                    size="lg"
                    className="shadow-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => setShowContactModal(true)}
                    className="shadow-sm"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Kontakt
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="lg"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Bio Section */}
            {record.bio && (
              <div className="prose prose-gray max-w-none">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">O mnie</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {record.bio}
                </p>
              </div>
            )}

            {/* Dance Styles */}
            {danceStyles.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
                  <Music className="w-5 h-5 text-purple-600" />
                  Style tańca
                </h3>
                <div className="space-y-3">
                  {danceStyles.map((style, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getSkillLevelIcon(style.level)}
                        <div>
                          <div className="font-medium text-gray-900">
                            {style.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {getSkillLevelLabel(style.level)}
                            {style.yearsExperience && style.yearsExperience > 0 && (
                              <span className="ml-2">
                                • {style.yearsExperience} {style.yearsExperience === 1 ? 'rok' : style.yearsExperience < 5 ? 'lata' : 'lat'} doświadczenia
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {style.isTeaching && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-0">
                          <Award className="w-3 h-3 mr-1" />
                          Nauczam
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructor Stats */}
            {isInstructor && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-purple-600" />
                  Statystyki instruktora
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {instructorStats.totalEvents}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Wydarzenia</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-pink-600">
                      {instructorStats.upcomingEvents}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Nadchodzące</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {instructorStats.totalStudents}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Uczniów</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-pink-600">
                      {instructorStats.averagePrice} PLN
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Średnia cena</div>
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Events */}
            {isInstructor && trainerEvents?.data && trainerEvents.data.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Nadchodzące zajęcia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {trainerEvents.data.slice(0, 4).map((event) => (
                    <div 
                      key={event.id} 
                      className="group p-4 border border-gray-200 rounded-xl hover:shadow-md hover:border-purple-200 transition-all cursor-pointer bg-white"
                      onClick={() => window.location.href = `/events/show/${event.id}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                            {event.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {format(new Date(event.start_datetime), "EEEE, d MMMM", { locale: pl })}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                          {format(new Date(event.start_datetime), "HH:mm")}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3 text-gray-600">
                          {event.dance_styles && (
                            <span className="flex items-center gap-1">
                              <Music className="w-3 h-3" />
                              {event.dance_styles.name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.current_participants}
                            {event.max_participants && `/${event.max_participants}`}
                          </span>
                        </div>
                        {event.price_amount !== null && event.price_amount !== undefined && (
                          <span className="font-semibold text-gray-900">
                            {event.price_amount === 0 ? 'Bezpłatne' : `${event.price_amount} PLN`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.location.href = `/events?organizer=${record.users?.id}`}
                >
                  Zobacz wszystkie zajęcia instruktora
                </Button>
              </div>
            )}

            {/* Additional Info */}
            <div className="flex flex-wrap gap-4 pt-6 border-t text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Dołączył: {format(new Date(record.created_at), "MMMM yyyy", { locale: pl })}</span>
              </div>
              {record.users?.last_seen_at && (
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>Ostatnio aktywny: {format(new Date(record.users.last_seen_at), "d MMMM", { locale: pl })}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {record.visibility === 'public' ? (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>Profil publiczny</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>Profil prywatny</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && !isOwnProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowContactModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
                <Heart className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Opcje kontaktu</h3>
              <p className="text-gray-600">
                Pełne opcje kontaktu będą dostępne po wzajemnym dopasowaniu. 
                Polub profil i czekaj na odpowiedź!
              </p>
            </div>
            
            <div className="space-y-3">
              <Button className="w-full" disabled variant="outline">
                <MessageCircle className="w-4 h-4 mr-2" />
                Czat (dostępny po dopasowaniu)
              </Button>
              <Button className="w-full" disabled variant="outline">
                <Phone className="w-4 h-4 mr-2" />
                Telefon (dostępny po dopasowaniu)
              </Button>
              <Button className="w-full" disabled variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Email (dostępny po dopasowaniu)
              </Button>
            </div>
            
            <Button 
              className="w-full mt-6" 
              variant="ghost"
              onClick={() => setShowContactModal(false)}
            >
              Zamknij
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};