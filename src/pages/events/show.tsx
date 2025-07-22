// src/pages/events/show.tsx
import {
  useShow,
  useNavigation,
  useGetIdentity,
  useCreate,
  useDelete,
  useList,
} from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Music,
  Star,
  Sparkles,
  TrendingUp,
  Edit,
  Trash,
  Share2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { useLoading, cn } from "@/utility";
import { format, differenceInHours } from "date-fns";
import { pl } from "date-fns/locale";
import { Event } from "./events";
import { UserIdentity } from "../dancers/dancers";
import { useState } from "react";
import { toast } from "sonner";

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
        dance_styles(name, category)`,
    },
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
        <Button onClick={() => list("events")}>Powrót do listy</Button>
      </div>
    );
  }

  // Obliczenia
  const userParticipation = eventParticipants.find(
    (p: any) => p.participant_id === identity?.id
  );
  const isOrganizer = record.organizer_id === identity?.id;
  const spotsLeft = record.max_participants
    ? record.max_participants - record.current_participants
    : null;
  const isFull = spotsLeft === 0;
  const hasStarted = new Date(record.start_datetime) < new Date();
  const hoursUntil = differenceInHours(
    new Date(record.start_datetime),
    new Date()
  );
  const isStartingSoon = hoursUntil >= 0 && hoursUntil <= 3;

  // Info o organizatorze
  const getOrganizerInfo = () => {
    const user = record.users;
    if (!user) return { name: "Nieznany organizator", photo: null };

    if (user.dancers?.[0]) {
      return {
        name: user.dancers[0].name,
        photo: user.dancers[0].profile_photo_url,
        id: user.dancers[0].id,
        type: "dancer",
      };
    } else if (user.dance_schools?.[0]) {
      return {
        name: user.dance_schools[0].name,
        photo: user.dance_schools[0].logo_url,
        id: user.dance_schools[0].id,
        type: "school",
      };
    }

    return { name: user.email, photo: null, type: "user" };
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
      course: <TrendingUp className="w-4 h-4" />,
    };
    return icons[category] || <Calendar className="w-4 h-4" />;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      lesson: "Lekcja",
      workshop: "Warsztaty",
      party: "Impreza",
      outdoor: "Plener",
      course: "Kurs",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      lesson: "bg-blue-100 text-blue-700",
      workshop: "bg-purple-100 text-purple-700",
      party: "bg-pink-100 text-pink-700",
      outdoor: "bg-green-100 text-green-700",
      course: "bg-orange-100 text-orange-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header z akcjami */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => list("events")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Wróć do wydarzeń
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
            {isOrganizer && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => edit("events", record.id)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Alert dla wydarzeń rozpoczynających się wkrótce */}
        {isStartingSoon && !hasStarted && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-900">
                To wydarzenie rozpoczyna się{" "}
                {hoursUntil === 0
                  ? "wkrótce"
                  : `za ${hoursUntil} godzin${hoursUntil === 1 ? "ę" : "y"}`}
                !
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lewa kolumna - główne informacje (2/3 szerokości na dużych ekranach) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Główna karta */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge
                        className={cn(
                          "text-xs",
                          getCategoryColor(record.event_category)
                        )}
                      >
                        {getEventIcon(record.event_category)}
                        <span className="ml-1">
                          {getCategoryLabel(record.event_category)}
                        </span>
                      </Badge>
                      {record.dance_styles && (
                        <Badge variant="outline" className="text-xs">
                          {record.dance_styles.name}
                        </Badge>
                      )}
                      {userParticipation && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700 text-xs"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Zapisany
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl mb-2">
                      {record.title}
                    </CardTitle>
                    <p className="text-gray-600">
                      Organizuje:{" "}
                      <span className="font-medium">{organizer.name}</span>
                    </p>
                  </div>
                  {record.price_amount !== null &&
                    record.price_amount !== undefined && (
                      <div className="text-right">
                        <p className="text-3xl font-bold text-purple-600">
                          {record.price_amount === 0
                            ? "FREE"
                            : `${record.price_amount}`}
                        </p>
                        {record.price_amount > 0 && (
                          <p className="text-sm text-gray-500">PLN</p>
                        )}
                      </div>
                    )}
                </div>
              </CardHeader>
              <CardContent>
                {record.description && (
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {record.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informacje o wydarzeniu */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Informacje o wydarzeniu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Data i czas */}
                  <div className="flex gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Data i godzina
                      </p>
                      <p className="font-medium">
                        {format(
                          new Date(record.start_datetime),
                          "EEEE, d MMMM yyyy",
                          { locale: pl }
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(record.start_datetime), "HH:mm")} -
                        {format(new Date(record.end_datetime), "HH:mm")}
                      </p>
                    </div>
                  </div>

                  {/* Lokalizacja */}
                  <div className="flex gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Miejsce</p>
                      {record.location_type === "online" ? (
                        <>
                          <p className="font-medium">Wydarzenie online</p>
                          {record.online_platform && (
                            <p className="text-sm text-gray-600">
                              Platforma: {record.online_platform}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          {record.location_name && (
                            <p className="font-medium">
                              {record.location_name}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            {record.address}
                            {record.city && `, ${record.city}`}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Uczestnicy */}
                  <div className="flex gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Uczestnicy</p>
                      <p className="font-medium">
                        {record.current_participants}
                        {record.max_participants &&
                          ` / ${record.max_participants}`}{" "}
                        osób
                      </p>
                      {spotsLeft !== null &&
                        spotsLeft > 0 &&
                        spotsLeft <= 5 && (
                          <p className="text-sm text-orange-600 font-medium">
                            Zostało tylko {spotsLeft} miejsc!
                          </p>
                        )}
                      {isFull && (
                        <p className="text-sm text-red-600 font-medium">
                          Brak wolnych miejsc
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Poziom */}
                  {record.skill_level_required && (
                    <div className="flex gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                        <Star className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Poziom</p>
                        <p className="font-medium capitalize">
                          {record.skill_level_required}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Wymagania */}
                {record.requires_partner && (
                  <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-900">Wymagania</p>
                        <p className="text-sm text-orange-800 mt-1">
                          To wydarzenie wymaga przyjścia z partnerem tanecznym
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dodatkowe informacje */}
            {(record.what_to_expect ||
              record.cancellation_policy ||
              (record.tags && record.tags.length > 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Dodatkowe informacje
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {record.what_to_expect && (
                    <div>
                      <h4 className="font-medium mb-2">Czego się spodziewać</h4>
                      <p className="text-sm text-gray-700">
                        {record.what_to_expect}
                      </p>
                    </div>
                  )}

                  {record.cancellation_policy && (
                    <div>
                      <h4 className="font-medium mb-2">Polityka anulowania</h4>
                      <p className="text-sm text-gray-700">
                        {record.cancellation_policy}
                      </p>
                    </div>
                  )}

                  {record.tags && record.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Tagi</h4>
                      <div className="flex flex-wrap gap-2">
                        {record.tags.map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Prawa kolumna - sidebar (1/3 szerokości na dużych ekranach) */}
          <div className="space-y-6">
            {/* CTA Card */}
            <Card
              className={cn(
                "sticky top-4",
                userParticipation && "border-green-200 bg-green-50/50"
              )}
            >
              <CardContent className="pt-6">
                {!isOrganizer ? (
                  <div className="space-y-3">
                    {userParticipation ? (
                      <>
                        <div className="text-center mb-4">
                          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                          <p className="font-medium text-green-900">
                            Jesteś zapisany na to wydarzenie
                          </p>
                        </div>
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => list("events")}
                        >
                          Zobacz inne wydarzenia
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={handleSignUp}
                          disabled={isFull || hasStarted || !identity}
                        >
                          {!identity
                            ? "Zaloguj się aby się zapisać"
                            : isFull
                            ? "Brak miejsc"
                            : hasStarted
                            ? "Wydarzenie już się rozpoczęło"
                            : "Zapisz się na wydarzenie"}
                        </Button>
                        {!identity && (
                          <p className="text-xs text-gray-600 text-center">
                            Musisz być zalogowany, aby zapisać się na wydarzenie
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 text-center">
                    <div className="p-3 bg-purple-100 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                      <Star className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Zarządzasz tym wydarzeniem
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => edit("events", record.id)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edytuj wydarzenie
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => list("events")}
                    >
                      Zobacz statystyki
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organizator */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Organizator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={organizer.photo || undefined} />
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      {organizer.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{organizer.name}</p>
                    <p className="text-sm text-gray-600">
                      {organizer.type === "dancer"
                        ? "Instruktor tańca"
                        : organizer.type === "school"
                        ? "Szkoła tańca"
                        : "Organizator"}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Zobacz profil
                </Button>
              </CardContent>
            </Card>

            {/* Share Card */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 mb-3 text-center">
                  Podziel się tym wydarzeniem
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Skopiuj link
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
