// src/pages/events/list.tsx
import {
  useTable,
  useNavigation,
  useGetIdentity,
  useList,
} from "@refinedev/core";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Search,
  Plus,
  Music,
  Sparkles,
  Heart,
  Star,
  TrendingUp,
  Zap,
  Filter,
  CheckCircle,
} from "lucide-react";
import { useLoading } from "@/utility";
import { Badge, Button, Input } from "@/components/ui";
import { useState, useEffect } from "react";
import { format, isToday, isTomorrow, differenceInHours } from "date-fns";
import { pl } from "date-fns/locale";
import { Event, EventParticipant } from "./events";
import { UserIdentity } from "../dancers/dancers";
import { cn } from "@/utility";

export const EventsList = () => {
  const { data: identity } = useGetIdentity<UserIdentity>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const {
    tableQuery: { data, isLoading, isError },
  } = useTable<Event>({
    resource: "events",
    meta: {
      select: `*, 
        users!events_organizer_id_fkey(
          email,
          dancers(name, profile_photo_url),
          dance_schools(name, logo_url)
        ),
        dance_styles(name, category)`,
    },
    filters: {
      initial: [
        {
          field: "title",
          operator: "contains",
          value: searchTerm,
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
    },
    sorters: {
      initial: [
        {
          field: "start_datetime",
          order: "asc",
        },
      ],
    },
    pagination: {
      pageSize: 20,
    },
  });

  // Pobierz wszystkie zapisy użytkownika
  const { data: userParticipations } = useList<EventParticipant>({
    resource: "event_participants",
    filters: [
      {
        field: "participant_id",
        operator: "eq",
        value: identity?.id || "",
      },
    ],
    queryOptions: {
      enabled: !!identity?.id,
    },
  });

  const participatingEventIds =
    userParticipations?.data?.map((p) => p.event_id) || [];

  const { show, create } = useNavigation();
  const init = useLoading({ isLoading, isError });

  if (init) return init;

  const events = (data?.data as Event[]) || [];

  // Grupuj wydarzenia
  const todayEvents = events.filter((e) => isToday(new Date(e.start_datetime)));
  const tomorrowEvents = events.filter((e) =>
    isTomorrow(new Date(e.start_datetime))
  );
  const thisWeekEvents = events.filter((e) => {
    const eventDate = new Date(e.start_datetime);
    const now = new Date();
    const diffDays = Math.ceil(
      (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays > 1 && diffDays <= 7;
  });
  const laterEvents = events.filter((e) => {
    const eventDate = new Date(e.start_datetime);
    const now = new Date();
    const diffDays = Math.ceil(
      (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays > 7;
  });

  // Wydarzenia rozpoczynające się wkrótce
  const soonEvents = events.filter((e) => {
    const hours = differenceInHours(new Date(e.start_datetime), new Date());
    return hours >= 0 && hours <= 3;
  });

  // Filtrowane wydarzenia
  const filteredEvents = (() => {
    switch (selectedFilter) {
      case "starting-soon":
        return soonEvents;
      case "free":
        return events.filter((e) => !e.price_amount || e.price_amount === 0);
      case "beginner":
        return events.filter(
          (e) =>
            e.skill_level_required === "beginner" || !e.skill_level_required
        );
      case "needs-partner":
        return events.filter((e) => e.requires_partner);
      case "my-events":
        return events.filter((e) => participatingEventIds.includes(e.id));
      default:
        return events;
    }
  })();

  const getOrganizerInfo = (event: Event) => {
    const user = event.users;
    if (!user)
      return { name: "Nieznany organizator", photo: null, type: "unknown" };

    if (user.dancers && user.dancers.length > 0) {
      return {
        name: user.dancers[0].name,
        photo: user.dancers[0].profile_photo_url,
        type: "dancer",
      };
    } else if (user.dance_schools && user.dance_schools.length > 0) {
      return {
        name: user.dance_schools[0].name,
        photo: user.dance_schools[0].logo_url,
        type: "school",
      };
    }

    return { name: user.email, photo: null, type: "user" };
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

  const quickFilters = [
    { id: "all", label: "Wszystkie", icon: null },
    {
      id: "starting-soon",
      label: "Zaczynają się wkrótce",
      icon: <Zap className="w-3 h-3" />,
    },
    { id: "free", label: "Darmowe", icon: <Heart className="w-3 h-3" /> },
    {
      id: "beginner",
      label: "Dla początkujących",
      icon: <Star className="w-3 h-3" />,
    },
    {
      id: "needs-partner",
      label: "Szukam partnera",
      icon: <Users className="w-3 h-3" />,
    },
    ...(identity
      ? [
          {
            id: "my-events",
            label: "Moje wydarzenia",
            icon: <CheckCircle className="w-3 h-3" />,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 relative ">
      {/* Hero Section */}
      {/* Hero Section */}
      <div className="mb-12 relative overflow-hidden bg-gradient-to-br from-purple-500/70 via-pink-400/60 to-purple-600/50 mb-6">
        {/* Warstwy gradientów dla głębi */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 via-transparent to-purple-400/10" />
          {/* Delikatny efekt blasku */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-300/20 rounded-full filter blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/20 rounded-full filter blur-3xl" />
        </div>

        {/* Zawartość */}
        <div className="relative p-8 md:p-12 pb-16 md:pb-20">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white drop-shadow-lg">
              Znajdź swój taniec
            </h1>
            <p className="text-lg text-white/95 mb-8 drop-shadow">
              Zajęcia, imprezy i warsztaty w Twojej okolicy
            </p>

            {/* Search Bar z delikatnym różowym akcentem */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-600 w-5 h-5" />
              <input
                placeholder="Szukaj stylu, instruktora lub miejsca..."
                className="w-full pl-12 pr-4 h-14 text-lg bg-white/90 backdrop-blur-md text-gray-900 border border-purple-200/30 rounded-2xl shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-400/30 focus:bg-white focus:border-purple-300/50 transition-all placeholder:text-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {identity && (
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 shadow-lg transition-all flex items-center gap-2 text-sm font-medium"
                  onClick={() => create("events")}
                >
                  <Plus className="w-4 h-4" />
                  Dodaj wydarzenie
                </button>
              )}
            </div>

            {/* Quick Stats z eleganckimi separatorami */}
            <div className="grid grid-cols-3 gap-6 mt-10">
              <div className="text-center group">
                <p className="text-3xl font-bold text-white drop-shadow-md group-hover:scale-110 transition-transform">
                  {soonEvents.length}
                </p>
                <p className="text-sm text-white/90 mt-1 font-medium">
                  Dziś wieczorem
                </p>
              </div>
              <div className="text-center relative group">
                <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent" />
                <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent" />
                <p className="text-3xl font-bold text-white drop-shadow-md group-hover:scale-110 transition-transform">
                  {
                    events.filter(
                      (e) => !e.price_amount || e.price_amount === 0
                    ).length
                  }
                </p>
                <p className="text-sm text-white/90 mt-1 font-medium">
                  Darmowych
                </p>
              </div>
              <div className="text-center group">
                <p className="text-3xl font-bold text-white drop-shadow-md group-hover:scale-110 transition-transform">
                  {participatingEventIds.length}
                </p>
                <p className="text-sm text-white/90 mt-1 font-medium">
                  Twoje zapisy
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SVG na całą szerokość */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none">
          <svg
            className="relative block w-full h-12 md:h-16"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 0L0 20C200 25 400 27 600 27C800 27 1000 25 1200 20L1200 0V120H0V120Z"
              fill="rgba(255,255,255,0.3)"
              transform="rotate(-2 1200 60)"
            />
            <path
              d="M0 45L0 55C200 60 400 62 600 62C800 62 1000 60 1200 55L1200 45V120H0V120Z"
              fill="rgba(255,255,255,0.5)"
              transform="rotate(-0.5 1200 60)"
            />
            <path
              d="M0 80L0 90C200 95 400 97 600 97C800 97 1000 95 1200 90L1200 80V120H0V120Z"
              fill="rgba(255,255,255,0.9)"
            />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-6 px-6">
          {quickFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant={selectedFilter === filter.id ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all whitespace-nowrap px-4 py-2",
                selectedFilter === filter.id
                  ? "bg-purple-600 text-white border-purple-600"
                  : "hover:bg-purple-50 hover:border-purple-300"
              )}
              onClick={() => setSelectedFilter(filter.id)}
            >
              {filter.icon && <span className="mr-1">{filter.icon}</span>}
              {filter.label}
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Więcej filtrów
          </Button>
        </div>

        {/* Wyniki po filtrowaniu */}
        {selectedFilter !== "all" ? (
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-4">
              Znaleziono {filteredEvents.length} wydarzeń
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onShow={show}
                  isParticipating={participatingEventIds.includes(event.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Events starting soon - Special Section */}
            {soonEvents.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Zap className="w-5 h-5 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold">Zaczynają się wkrótce</h2>
                  <Badge
                    variant="destructive"
                    className="ml-auto animate-pulse"
                  >
                    LIVE
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {soonEvents.slice(0, 3).map((event) => {
                    const organizer = getOrganizerInfo(event);
                    const hoursUntil = differenceInHours(
                      new Date(event.start_datetime),
                      new Date()
                    );
                    const spotsLeft = event.max_participants
                      ? event.max_participants - event.current_participants
                      : null;
                    const isParticipating = participatingEventIds.includes(
                      event.id
                    );

                    return (
                      <Card
                        key={event.id}
                        className="overflow-hidden hover:shadow-xl transition-all duration-300 border-red-200 bg-red-50/50 cursor-pointer group"
                        onClick={() => event.id && show("events", event.id)}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="destructive">
                                  Za{" "}
                                  {hoursUntil === 0
                                    ? "chwilę"
                                    : `${hoursUntil}h`}
                                </Badge>
                                {isParticipating && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-green-700"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Zapisany
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-bold text-lg group-hover:text-purple-600 transition-colors">
                                {event.title}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {organizer.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">
                                {format(
                                  new Date(event.start_datetime),
                                  "HH:mm"
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.city || "Online"}
                            </span>
                            {event.dance_styles && (
                              <span className="flex items-center gap-1">
                                {getEventIcon(event.event_category)}
                                {event.dance_styles.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="flex items-center gap-2">
                              {spotsLeft !== null &&
                                spotsLeft <= 3 &&
                                spotsLeft > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-red-600 border-red-300"
                                  >
                                    Zostały {spotsLeft} miejsca!
                                  </Badge>
                                )}
                            </div>
                            <Button size="sm" className="ml-auto">
                              {isParticipating ? "Zobacz" : "Rezerwuj"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Today's Events */}
            {todayEvents.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Dziś
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {todayEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onShow={show}
                      isParticipating={participatingEventIds.includes(event.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tomorrow's Events */}
            {tomorrowEvents.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Jutro</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tomorrowEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onShow={show}
                      isParticipating={participatingEventIds.includes(event.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* This Week */}
            {thisWeekEvents.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">W tym tygodniu</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {thisWeekEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onShow={show}
                      isParticipating={participatingEventIds.includes(event.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Later */}
            {laterEvents.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Później</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {laterEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onShow={show}
                      isParticipating={participatingEventIds.includes(event.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg mb-4">
              Nie znaleziono żadnych wydarzeń
            </p>
            {identity && (
              <Button onClick={() => create("events")} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Dodaj pierwsze wydarzenie
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Komponent karty wydarzenia
const EventCard = ({
  event,
  onShow,
  isParticipating = false,
}: {
  event: Event;
  onShow: any;
  isParticipating?: boolean;
}) => {
  const getOrganizerInfo = (event: Event) => {
    const user = event.users;
    if (!user) return { name: "Nieznany organizator", photo: null };

    if (user.dancers && user.dancers.length > 0) {
      return {
        name: user.dancers[0].name,
        photo: user.dancers[0].profile_photo_url,
      };
    } else if (user.dance_schools && user.dance_schools.length > 0) {
      return {
        name: user.dance_schools[0].name,
        photo: user.dance_schools[0].logo_url,
      };
    }

    return { name: user.email, photo: null };
  };

  const organizer = getOrganizerInfo(event);
  const spotsLeft = event.max_participants
    ? event.max_participants - event.current_participants
    : null;
  const isFull = spotsLeft === 0;

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
    <Card
      className={cn(
        "overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group",
        isParticipating && "ring ring-purple-500/30"
      )}
      onClick={() => event.id && onShow("events", event.id)}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={cn(
                  "p-1.5 rounded-lg",
                  getCategoryColor(event.event_category)
                )}
              >
                {getEventIcon(event.event_category)}
              </div>
              {event.dance_styles && (
                <Badge variant="secondary" className="text-xs">
                  {event.dance_styles.name}
                </Badge>
              )}
              {isParticipating && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 text-xs"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Zapisany
                </Badge>
              )}
            </div>
            <h3 className="font-bold text-lg group-hover:text-purple-600 transition-colors line-clamp-1">
              {event.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{organizer.name}</p>
          </div>
          {event.price_amount !== null && event.price_amount !== undefined && (
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">
                {event.price_amount === 0 ? "FREE" : `${event.price_amount}`}
              </p>
              {event.price_amount > 0 && (
                <p className="text-xs text-gray-500">PLN</p>
              )}
            </div>
          )}
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>
              {format(new Date(event.start_datetime), "d MMM", { locale: pl })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{format(new Date(event.start_datetime), "HH:mm")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="truncate">
              {event.city ||
                (event.location_type === "online" ? "Online" : "TBD")}
            </span>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-3">
            {/* Participants */}
            <div className="flex items-center gap-1.5 text-sm">
              <Users className="w-4 h-4 text-gray-400" />
              <span
                className={cn(
                  "font-medium",
                  isFull ? "text-red-600" : "text-gray-600"
                )}
              >
                {event.current_participants}
                {event.max_participants && `/${event.max_participants}`}
              </span>
            </div>

            {/* Special badges */}
            {event.requires_partner && (
              <Badge variant="outline" className="text-xs">
                W parach
              </Badge>
            )}
            {spotsLeft !== null && spotsLeft <= 3 && spotsLeft > 0 && (
              <Badge
                variant="outline"
                className="text-xs text-orange-600 border-orange-300"
              >
                Ostatnie {spotsLeft}!
              </Badge>
            )}
            {isFull && (
              <Badge
                variant="outline"
                className="text-xs text-red-600 border-red-300"
              >
                Brak miejsc
              </Badge>
            )}
          </div>

          {/* CTA */}
          <Button
            size="sm"
            variant={isParticipating ? "outline" : "ghost"}
            className={cn(
              "ml-auto transition-all",
              !isParticipating &&
                "group-hover:bg-purple-600 group-hover:text-white"
            )}
            disabled={isFull && !isParticipating}
          >
            {isParticipating ? "Zobacz" : isFull ? "Pełne" : "Zobacz"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
