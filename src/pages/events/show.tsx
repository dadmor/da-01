// src/pages/events/show.tsx
import { useShow, useNavigation, useGetIdentity, useCreate, useDelete, useList } from "@refinedev/core";
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
  Star,
  Sparkles,
  TrendingUp,
  Heart,
  Edit,
  Trash,
  Share2,
  AlertCircle
} from "lucide-react";
import { Badge, Button, Separator } from "@/components/ui";
import { useLoading, cn } from "@/utility";
import { format, differenceInHours } from "date-fns";
import { pl } from "date-fns/locale";
import { Event } from "./events";
import { UserIdentity } from "../dancers/dancers";
import { useState } from "react";
import { toast } from "sonner";
import { FlexBox, GridBox } from "@/components/shared";

export const EventsShow = () => {
  const { data: identity } = useGetIdentity<UserIdentity>();
  const { list, edit } = useNavigation();
  const { mutate: deleteEvent } = useDelete();
  const { mutate: createParticipant } = useCreate();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { queryResult } = useShow<Event>({
    meta: {
      select: `*, 
        users!events_organizer_id_fkey(
          id,
          email,
          dancers(id, name, profile_photo_url),
          dance_schools(id, name, logo_url)
        ),
        dance_styles(name, category)`
    }
  });

  const { data, isLoading, isError } = queryResult;
  const record = data?.data;

  // Pobierz uczestników wydarzenia
  const { data: participantsData } = useList({
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
      <div className="p-6 text-center">
        <p className="text-red-500 text-lg mb-4">Wydarzenie nie znalezione</p>
        <Button onClick={() => list("events")}>
          Powrót do listy
        </Button>
      </div>
    );
  }

  // Obliczenia
  const userParticipation = eventParticipants.find(
    (p: any) => p.participant_id === identity?.id
  );
  const isOrganizer = record.organizer_id === identity?.id;
  const spotsLeft = record.max_participants ? 
    record.max_participants - record.current_participants : null;
  const isFull = spotsLeft === 0;
  const hasStarted = new Date(record.start_datetime) < new Date();
  
  // Info o organizatorze
  const getOrganizerInfo = () => {
    const user = record.users;
    if (!user) return { name: 'Nieznany organizator', photo: null };
    
    if (user.dancers?.[0]) {
      return {
        name: user.dancers[0].name,
        photo: user.dancers[0].profile_photo_url,
        id: user.dancers[0].id,
        type: 'dancer'
      };
    } else if (user.dance_schools?.[0]) {
      return {
        name: user.dance_schools[0].name,
        photo: user.dance_schools[0].logo_url,
        id: user.dance_schools[0].id,
        type: 'school'
      };
    }
    
    return { name: user.email, photo: null, type: 'user' };
  };

  const organizer = getOrganizerInfo();

  const handleDelete = () => {
    if (!window.confirm("Czy na pewno chcesz usunąć to wydarzenie?")) return;
    
    setIsDeleting(true);
    deleteEvent(
      {
        resource: "events",
        id: record.id,
      },
      {
        onSuccess: () => {
          toast.success("Wydarzenie zostało usunięte");
          list("events");
        },
        onError: () => {
          toast.error("Błąd podczas usuwania wydarzenia");
          setIsDeleting(false);
        },
      }
    );
  };

  const handleSignUp = () => {
    if (!identity) {
      toast.error("Musisz być zalogowany");
      return;
    }
    
    createParticipant(
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
          toast.success("Zapisano na wydarzenie!");
          queryResult.refetch();
          window.location.reload();
        },
        onError: (error: any) => {
          console.error("Błąd zapisu:", error);
          toast.error("Nie udało się zapisać na wydarzenie");
        },
      }
    );
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link skopiowany do schowka");
  };

  const getEventIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      lesson: <Music className="w-4 h-4" />,
      workshop: <Star className="w-4 h-4" />,
      party: <Sparkles className="w-4 h-4" />,
      outdoor: <MapPin className="w-4 h-4" />,
      course: <TrendingUp className="w-4 h-4" />
    };
    return icons[category] || <Calendar className="w-4 h-4" />;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      lesson: 'Lekcja',
      workshop: 'Warsztaty',
      party: 'Impreza',
      outdoor: 'Plener',
      course: 'Kurs'
    };
    return labels[category] || category;
  };

  return (
    <>
      {/* Header z akcjami */}
      <FlexBox className="justify-between items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => list("events")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Powrót
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>
          {isOrganizer && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => edit("events", record.id)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </FlexBox>

      <GridBox variant="1-2-2">
        {/* Lewa kolumna - główne informacje */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{record.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">
                      {getEventIcon(record.event_category)}
                      <span className="ml-1">{getCategoryLabel(record.event_category)}</span>
                    </Badge>
                    {record.dance_styles && (
                      <Badge variant="outline">{record.dance_styles.name}</Badge>
                    )}
                  </div>
                </div>
                {record.price_amount !== null && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">
                      {record.price_amount === 0 ? 'DARMOWE' : `${record.price_amount} PLN`}
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {record.description && (
                <p className="text-gray-700 whitespace-pre-wrap">{record.description}</p>
              )}
            </CardContent>
          </Card>

          {/* Szczegóły */}
          <Card>
            <CardHeader>
              <CardTitle>Szczegóły</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Data i czas */}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">
                    {format(new Date(record.start_datetime), "EEEE, d MMMM yyyy", { locale: pl })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(record.start_datetime), "HH:mm")} - 
                    {format(new Date(record.end_datetime), "HH:mm")}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Lokalizacja */}
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  {record.location_type === 'online' ? (
                    <>
                      <p className="font-medium">Wydarzenie online</p>
                      {record.online_platform && (
                        <p className="text-sm text-gray-600">{record.online_platform}</p>
                      )}
                    </>
                  ) : (
                    <>
                      {record.location_name && (
                        <p className="font-medium">{record.location_name}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {record.address}
                        {record.city && `, ${record.city}`}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Uczestnicy */}
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium">
                    {record.current_participants} uczestników
                    {record.max_participants && ` / ${record.max_participants}`}
                  </p>
                  {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 5 && (
                    <p className="text-sm text-orange-600">
                      Zostało tylko {spotsLeft} miejsc!
                    </p>
                  )}
                  {isFull && (
                    <p className="text-sm text-red-600">Brak wolnych miejsc</p>
                  )}
                </div>
              </div>

              {/* Wymagania */}
              {(record.skill_level_required || record.requires_partner) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="font-medium">Wymagania:</span>
                    </div>
                    {record.skill_level_required && (
                      <p className="text-sm text-gray-600 ml-6">
                        Poziom: {record.skill_level_required}
                      </p>
                    )}
                    {record.requires_partner && (
                      <p className="text-sm text-gray-600 ml-6">
                        Wymagany partner taneczny
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tagi */}
          {record.tags && record.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tagi</CardTitle>
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
        </div>

        {/* Prawa kolumna */}
        <div className="space-y-6">
          {/* Organizator */}
          <Card>
            <CardHeader>
              <CardTitle>Organizator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={organizer.photo || undefined} />
                  <AvatarFallback>{organizer.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{organizer.name}</p>
                  <p className="text-sm text-gray-600">
                    {organizer.type === 'dancer' ? 'Instruktor' : 
                     organizer.type === 'school' ? 'Szkoła tańca' : 'Organizator'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Akcje */}
          <Card>
            <CardContent className="pt-6">
              {!isOrganizer && (
                <div className="space-y-3">
                  {userParticipation ? (
                    <Button className="w-full" variant="outline" disabled>
                      <Users className="w-4 h-4 mr-2" />
                      Jesteś zapisany
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={handleSignUp}
                      disabled={isFull || hasStarted}
                    >
                      {isFull ? 'Brak miejsc' :
                       hasStarted ? 'Wydarzenie już się rozpoczęło' :
                       'Zapisz się'}
                    </Button>
                  )}
                </div>
              )}
              
              {isOrganizer && (
                <div className="space-y-2 text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Zarządzasz tym wydarzeniem
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => edit("events", record.id)}
                  >
                    Edytuj wydarzenie
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Polityka anulowania */}
          {record.cancellation_policy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Polityka anulowania</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{record.cancellation_policy}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </GridBox>
    </>
  );
};