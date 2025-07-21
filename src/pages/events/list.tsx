// src/pages/events/list.tsx
import { useTable, useNavigation, useGetIdentity } from "@refinedev/core";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Search,
  Filter,
  Plus,
  DollarSign,
  Music
} from "lucide-react";
import { FlexBox } from "@/components/shared";
import { PaginationSwitch } from "@/components/navigation";
import { Lead } from "@/components/reader";
import { useLoading } from "@/utility";
import { Badge, Button, Input, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Event } from "./events";
import { UserIdentity } from "../dancers/dancers";

export const EventsList = () => {
  const { data: identity } = useGetIdentity<UserIdentity>();
  const [searchTerm, setSearchTerm] = useState("");
  const [eventType, setEventType] = useState<"all" | "lesson" | "workshop" | "outdoor" | "party">("all");
  
  const {
    tableQuery: { data, isLoading, isError },
    current,
    setCurrent,
    pageSize,
  } = useTable<Event>({
    resource: "events",
    meta: {
      select: `*, 
        users!events_organizer_id_fkey(
          email,
          dancers(name, profile_photo_url),
          dance_schools(name, logo_url)
        ),
        dance_styles(name)`
    },
    filters: [
      {
        field: "title",
        operator: "contains",
        value: searchTerm,
      },
      ...(eventType !== "all" ? [{
        field: "event_category",
        operator: "eq",
        value: eventType,
      }] : []),
      {
        field: "start_datetime",
        operator: "gte",
        value: new Date().toISOString(),
      },
    ],
    sorters: {
      initial: [
        {
          field: "start_datetime",
          order: "asc",
        },
      ],
    },
    pagination: {
      pageSize: 12,
    },
  });
  
  const { show, create } = useNavigation();
  const init = useLoading({ isLoading, isError });

  if (init) return init;

  const getEventCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      lesson: 'Lekcja',
      workshop: 'Warsztaty',
      outdoor: 'Plener',
      party: 'Impreza',
      course: 'Kurs'
    };
    return categories[category] || category;
  };

  const getEventCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      lesson: 'default',
      workshop: 'secondary',
      outdoor: 'success',
      party: 'destructive',
      course: 'outline'
    };
    return colors[category] || 'default';
  };

  const getOrganizerInfo = (event: Event) => {
    const user = event.users;
    if (!user) return { name: 'Nieznany organizator', photo: null };
    
    if (user.dancers && user.dancers.length > 0) {
      return {
        name: user.dancers[0].name,
        photo: user.dancers[0].profile_photo_url
      };
    } else if (user.dance_schools && user.dance_schools.length > 0) {
      return {
        name: user.dance_schools[0].name,
        photo: user.dance_schools[0].logo_url
      };
    }
    
    return { name: user.email, photo: null };
  };

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
      <FlexBox>
        <Lead
          title="Wydarzenia"
          description="Znajdź lekcje, warsztaty i imprezy taneczne"
          className="mb-6 md:mb-8"
        />
        {identity && (
          <Button onClick={() => create("events")}>
            <Plus className="w-4 h-4 mr-2" />
            Dodaj wydarzenie
          </Button>
        )}
      </FlexBox>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        <div className="relative max-w-md mx-auto md:max-w-xl lg:max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Szukaj wydarzeń..."
            className="pl-10 h-10 md:h-11 lg:h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={eventType} onValueChange={(v) => setEventType(v as any)}>
          <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto">
            <TabsTrigger value="all">Wszystkie</TabsTrigger>
            <TabsTrigger value="lesson">Lekcje</TabsTrigger>
            <TabsTrigger value="workshop">Warsztaty</TabsTrigger>
            <TabsTrigger value="outdoor">Plenery</TabsTrigger>
            <TabsTrigger value="party">Imprezy</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {data?.data?.map((event) => {
          const organizer = getOrganizerInfo(event);
          const spotsLeft = event.max_participants ? 
            event.max_participants - event.current_participants : null;
          
          return (
            <Card 
              key={event.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              onClick={() => show("events", event.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {organizer.name}
                    </p>
                  </div>
                  <Badge variant={getEventCategoryColor(event.event_category) as any}>
                    {getEventCategoryLabel(event.event_category)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Date and Time */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {format(new Date(event.start_datetime), "d MMMM yyyy", { locale: pl })}
                  </span>
                  <Clock className="w-4 h-4 text-muted-foreground ml-2" />
                  <span>
                    {format(new Date(event.start_datetime), "HH:mm")}
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">
                    {event.location_name || event.address || 
                     (event.location_type === 'online' ? 'Online' : 'Lokalizacja TBD')}
                  </span>
                </div>

                {/* Dance Style */}
                {event.dance_styles && (
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      {event.dance_styles.name}
                    </Badge>
                  </div>
                )}

                {/* Price and Participants */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    {event.max_participants ? (
                      <span className={spotsLeft === 0 ? "text-red-500" : ""}>
                        {event.current_participants}/{event.max_participants}
                        {spotsLeft === 0 && " (Brak miejsc)"}
                      </span>
                    ) : (
                      <span>{event.current_participants} uczestników</span>
                    )}
                  </div>
                  
                  {event.price_amount !== null && event.price_amount !== undefined && (
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <DollarSign className="w-4 h-4" />
                      {event.price_amount} {event.price_currency || 'PLN'}
                      {event.price_per && (
                        <span className="text-xs text-muted-foreground">
                          /{event.price_per === 'person' ? 'os' : 
                            event.price_per === 'couple' ? 'para' : 
                            event.price_per === 'hour' ? 'godz' : 
                            event.price_per}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {event.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {data?.data?.length === 0 && (
        <div className="text-center py-12 md:py-16">
          <p className="text-muted-foreground text-base md:text-lg mb-4">
            Nie znaleziono żadnych wydarzeń
          </p>
          {identity && (
            <Button onClick={() => create("events")}>
              <Plus className="w-4 h-4 mr-2" />
              Dodaj pierwsze wydarzenie
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {data && data.total > pageSize && (
        <div className="mt-8 md:mt-12">
          <PaginationSwitch
            current={current}
            pageSize={pageSize}
            total={data.total || 0}
            setCurrent={setCurrent}
            itemName="wydarzeń"
          />
        </div>
      )}
    </div>
  );
};