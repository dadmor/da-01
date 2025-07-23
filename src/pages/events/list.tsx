// ------ src/pages/events/list.tsx ------
import { useTable, useNavigation, useGetIdentity } from "@refinedev/core";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CalendarDays,
  MapPin,
  Users,
  Clock,
  Music,
  Search,
  Filter,
  Plus,
  DollarSign,
  GraduationCap,
  Globe,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trophy,
  PartyPopper,
  BookOpen,
  Mic,
} from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { PaginationSwith } from "@/components/navigation";
import { Lead } from "@/components/reader";
import { useLoading } from "@/utility";
import { Badge, Button, Input } from "@/components/ui";
import { SubPage } from "@/components/layout";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface DanceStyle {
  id: string;
  name: string;
}

interface Event {
  id: string;
  organizer_id: string;
  title: string;
  description?: string;
  event_type: string;
  dance_style_id?: string;
  dance_style?: DanceStyle;
  start_at: string;
  end_at: string;
  is_recurring: boolean;
  location_type: string;
  location_name?: string;
  address?: string;
  city?: string;
  location_lat?: number;
  location_lng?: number;
  online_platform?: string;
  online_link?: string;
  website_url?: string;
  registration_url?: string;
  min_participants: number;
  max_participants?: number;
  participant_count: number;
  waitlist_count: number;
  skill_level_min?: string;
  skill_level_max?: string;
  price: number;
  currency: string;
  early_bird_price?: number;
  early_bird_deadline?: string;
  requires_partner: boolean;
  age_min?: number;
  age_max?: number;
  status: string;
  visibility: string;
  created_at: string;
  updated_at: string;
}

export const EventsList = () => {
  const { data: identity } = useGetIdentity<any>();
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("published");

  const {
    tableQuery: { data, isLoading, isError },
    current,
    setCurrent,
    pageSize,
    setFilters,
  } = useTable({
    resource: "v_events_with_counts",
    pagination: {
      pageSize: 12,
    },
    filters: {
      initial: [
        {
          field: "status",
          operator: "eq",
          value: "published",
        },
      ],
    },
    sorters: {
      initial: [
        {
          field: "start_at",
          order: "asc",
        },
      ],
    },
  });

  const { show, create } = useNavigation();

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    updateFilters(value, eventTypeFilter, statusFilter);
  };

  const handleEventTypeFilter = (value: string) => {
    setEventTypeFilter(value);
    updateFilters(searchQuery, value, statusFilter);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    updateFilters(searchQuery, eventTypeFilter, value);
  };

  const updateFilters = (search: string, eventType: string, status: string) => {
    const filters: any[] = [];

    if (status !== "all") {
      filters.push({
        field: "status",
        operator: "eq",
        value: status,
      });
    }

    if (eventType !== "all") {
      filters.push({
        field: "event_type",
        operator: "eq",
        value: eventType,
      });
    }

    if (search) {
      filters.push({
        field: "title",
        operator: "contains" as any,
        value: search,
      });
    }

    setFilters(filters);
  };

  const init = useLoading({ isLoading, isError });
  if (init) return init;

  const events = (data?.data as Event[]) || [];

  // Funkcje pomocnicze
  const getEventTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      lesson: <BookOpen className="w-4 h-4" />,
      workshop: <GraduationCap className="w-4 h-4" />,
      social: <PartyPopper className="w-4 h-4" />,
      competition: <Trophy className="w-4 h-4" />,
      performance: <Mic className="w-4 h-4" />,
    };
    return icons[type] || <CalendarDays className="w-4 h-4" />;
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      lesson: "Lekcja",
      workshop: "Warsztaty",
      social: "Potańcówka",
      competition: "Zawody",
      performance: "Występ",
    };
    return labels[type] || type;
  };

  const getLocationTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      physical: <MapPin className="w-3 h-3" />,
      online: <Globe className="w-3 h-3" />,
      hybrid: <Users className="w-3 h-3" />,
    };
    return icons[type] || <MapPin className="w-3 h-3" />;
  };

  const getSkillLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      beginner: "Początkujący",
      intermediate: "Średniozaawansowany",
      advanced: "Zaawansowany",
      professional: "Profesjonalny",
    };
    return labels[level] || level;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { icon: JSX.Element; variant: any; label: string }
    > = {
      draft: {
        icon: <AlertCircle className="w-3 h-3" />,
        variant: "secondary",
        label: "Szkic",
      },
      published: {
        icon: <CheckCircle2 className="w-3 h-3" />,
        variant: "default",
        label: "Opublikowane",
      },
      cancelled: {
        icon: <XCircle className="w-3 h-3" />,
        variant: "destructive",
        label: "Odwołane",
      },
      completed: {
        icon: <CheckCircle2 className="w-3 h-3" />,
        variant: "outline",
        label: "Zakończone",
      },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge variant={config.variant}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </Badge>
    );
  };

  const isEventPast = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const formatEventDate = (startAt: string, endAt: string) => {
    const start = new Date(startAt);
    const end = new Date(endAt);

    if (start.toDateString() === end.toDateString()) {
      // Ten sam dzień
      return `${format(start, "d MMM yyyy", { locale: pl })} • ${format(
        start,
        "HH:mm"
      )} - ${format(end, "HH:mm")}`;
    } else {
      // Różne dni
      return `${format(start, "d MMM", { locale: pl })} - ${format(
        end,
        "d MMM yyyy",
        { locale: pl }
      )}`;
    }
  };

  return (
    <SubPage>
      {/* Nagłówek - responsywny */}
      <FlexBox className="flex-col sm:flex-row gap-4">
        <Lead
          title="Wydarzenia"
          description="Przeglądaj i zarządzaj wydarzeniami tanecznymi"
        />
        <Button onClick={() => create("events")} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Dodaj wydarzenie
        </Button>
      </FlexBox>

      {/* Sekcja filtrów - responsywna */}
      <div className="space-y-4">
        {/* Wyszukiwarka */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Szukaj wydarzeń..."
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Filtry i licznik - responsywne */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={eventTypeFilter}
              onValueChange={handleEventTypeFilter}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Typ wydarzenia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie typy</SelectItem>
                <SelectItem value="lesson">Lekcje</SelectItem>
                <SelectItem value="workshop">Warsztaty</SelectItem>
                <SelectItem value="social">Potańcówki</SelectItem>
                <SelectItem value="competition">Zawody</SelectItem>
                <SelectItem value="performance">Występy</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                <SelectItem value="published">Opublikowane</SelectItem>
                <SelectItem value="draft">Szkice</SelectItem>
                <SelectItem value="cancelled">Odwołane</SelectItem>
                <SelectItem value="completed">Zakończone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Badge variant="outline" className="self-start sm:self-auto">
            <CalendarDays className="w-3 h-3 mr-1" />
            {data?.total || 0} wydarzeń
          </Badge>
        </div>
      </div>

      {/* Siatka wydarzeń - responsywna */}
      <GridBox variant="1-2-3" className="gap-4 sm:gap-6">
        {events.map((event) => {
          const isPast = isEventPast(event.end_at);
          const isOrganizer = event.organizer_id === identity?.id;
          const spotsLeft = event.max_participants
            ? event.max_participants - event.participant_count
            : null;
          const isFull = spotsLeft !== null && spotsLeft <= 0;

          return (
            <Card
              key={event.id}
              className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer ${
                isPast ? "opacity-60" : ""
              }`}
              onClick={() => show("events", event.id)}
            >
              {/* Nagłówek z typem wydarzenia */}
              <CardHeader className="pb-3 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 w-fit"
                  >
                    {getEventTypeIcon(event.event_type)}
                    <span className="whitespace-nowrap">
                      {getEventTypeLabel(event.event_type)}
                    </span>
                  </Badge>
                  {isOrganizer && (
                    <Badge variant="outline" className="text-xs w-fit">
                      Moje wydarzenie
                    </Badge>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-semibold line-clamp-2">
                  {event.title}
                </h3>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Data i czas */}
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2 break-words">
                    {formatEventDate(event.start_at, event.end_at)}
                  </span>
                </div>

                {/* Lokalizacja */}
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  {getLocationTypeIcon(event.location_type)}
                  <span className="line-clamp-2 break-words">
                    {event.location_type === "online"
                      ? event.online_platform || "Online"
                      : event.location_name || event.city || "Brak lokalizacji"}
                  </span>
                </div>

                {/* Styl tańca */}
                {event.dance_style && (
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Badge variant="outline" className="text-xs">
                      {event.dance_style.name}
                    </Badge>
                  </div>
                )}

                {/* Poziom */}
                {(event.skill_level_min || event.skill_level_max) && (
                  <div className="text-xs text-muted-foreground">
                    Poziom:{" "}
                    {event.skill_level_min &&
                      getSkillLevelLabel(event.skill_level_min)}
                    {event.skill_level_min &&
                      event.skill_level_max &&
                      event.skill_level_min !== event.skill_level_max &&
                      " - "}
                    {event.skill_level_max &&
                      event.skill_level_min !== event.skill_level_max &&
                      getSkillLevelLabel(event.skill_level_max)}
                  </div>
                )}

                {/* Opis */}
                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                )}

                {/* Dolna sekcja z ceną i uczestnikami */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Cena */}
                    {event.price > 0 ? (
                      <Badge variant="outline" className="text-xs">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {event.price} {event.currency}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs text-green-600"
                      >
                        Bezpłatne
                      </Badge>
                    )}

                    {/* Wymagany partner */}
                    {event.requires_partner && (
                      <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />W parze
                      </Badge>
                    )}
                  </div>

                  {/* Liczba uczestników */}
                  <div className="flex items-center gap-1 text-xs">
                    <Users className="w-3 h-3" />
                    <span className="font-medium">
                      {event.participant_count}
                    </span>
                    {event.max_participants && (
                      <span className="text-muted-foreground">
                        /{event.max_participants}
                      </span>
                    )}
                    {event.waitlist_count > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        +{event.waitlist_count}
                      </Badge>
                    )}
                    {isFull && event.waitlist_count === 0 && (
                      <Badge variant="destructive" className="ml-1 text-xs">
                        Brak miejsc
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Status */}
                {event.status !== "published" && (
                  <div className="pt-2">{getStatusBadge(event.status)}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </GridBox>

      {/* Pusta lista */}
      {events.length === 0 && (
        <Card className="p-8 sm:p-12 text-center border-dashed">
          <CalendarDays className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2">
            Nie znaleziono wydarzeń
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            {searchQuery ||
            eventTypeFilter !== "all" ||
            statusFilter !== "published"
              ? "Spróbuj zmienić kryteria wyszukiwania"
              : "Brak dostępnych wydarzeń w tym momencie"}
          </p>
          <Button onClick={() => create("events")} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Dodaj pierwsze wydarzenie
          </Button>
        </Card>
      )}

      {/* Paginacja */}
      <PaginationSwith
        current={current}
        pageSize={pageSize}
        total={data?.total || 0}
        setCurrent={setCurrent}
        itemName="wydarzeń"
      />
    </SubPage>
  );
};
