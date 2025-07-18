// src/pages/outdoor-events/list.tsx
import { useTable, useNavigation } from "@refinedev/core";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Eye, Edit, Calendar, MapPin, Users, Plus, Music, Sun } from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { PaginationSwitch } from "@/components/navigation";
import { Lead } from "@/components/reader";
import { useLoading } from "@/utility";
import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";

export const OutdoorEventsList = () => {
  const {
    tableQuery: { data, isLoading, isError },
    current,
    setCurrent,
    pageSize,
    setFilters,
  } = useTable({
    sorters: {
      initial: [
        {
          field: "event_date",
          order: "asc",
        },
      ],
    },
  });
  
  const { create, edit, show } = useNavigation();
  const init = useLoading({ isLoading, isError });
  if (init) return init;

  const formatEventDate = (date: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Dzisiaj";
    if (diffDays === 1) return "Jutro";
    if (diffDays > 0 && diffDays <= 7) return `Za ${diffDays} dni`;
    
    return eventDate.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <FlexBox>
        <Lead
          title="Wydarzenia plenerowe"
          description="Odkryj taneczne wydarzenia na świeżym powietrzu"
        />
        <Button onClick={() => create("outdoor_events")}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj wydarzenie
        </Button>
      </FlexBox>

      <FlexBox className="gap-4">
        <Input
          placeholder="Szukaj wydarzeń..."
          className="max-w-sm"
          onChange={(e) => {
            setFilters([
              {
                field: "name",
                operator: "contains",
                value: e.target.value,
              },
            ]);
          }}
        />
        <Select
          onValueChange={(value) => {
            if (value === "all") {
              setFilters([]);
            } else {
              setFilters([
                {
                  field: "city",
                  operator: "eq",
                  value: value,
                },
              ]);
            }
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Wszystkie miasta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie miasta</SelectItem>
            <SelectItem value="Warszawa">Warszawa</SelectItem>
            <SelectItem value="Kraków">Kraków</SelectItem>
            <SelectItem value="Wrocław">Wrocław</SelectItem>
            <SelectItem value="Poznań">Poznań</SelectItem>
            <SelectItem value="Gdańsk">Gdańsk</SelectItem>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => {
            const today = new Date();
            if (value === "all") {
              setFilters([]);
            } else if (value === "upcoming") {
              setFilters([
                {
                  field: "event_date",
                  operator: "gte",
                  value: today.toISOString(),
                },
              ]);
            } else if (value === "past") {
              setFilters([
                {
                  field: "event_date",
                  operator: "lt",
                  value: today.toISOString(),
                },
              ]);
            }
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Wszystkie wydarzenia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie wydarzenia</SelectItem>
            <SelectItem value="upcoming">Nadchodzące</SelectItem>
            <SelectItem value="past">Minione</SelectItem>
          </SelectContent>
        </Select>
      </FlexBox>

      <GridBox>
        {data?.data?.map((event: any) => {
          const eventDate = new Date(event.event_date);
          const isPast = eventDate < new Date();
          
          return (
            <Card key={event.id} className={isPast ? "opacity-60" : ""}>
              {event.cover_image && (
                <div className="h-48 relative">
                  <img
                    src={event.cover_image}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-yellow-500 text-white">
                      <Sun className="w-3 h-3 mr-1" />
                      Plenerowe
                    </Badge>
                  </div>
                  {isPast && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Badge variant="secondary" className="text-lg">
                        Zakończone
                      </Badge>
                    </div>
                  )}
                </div>
              )}
              <CardHeader>
                <div>
                  <h3 className="font-semibold text-lg">{event.name}</h3>
                  <div className="space-y-1 mt-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatEventDate(event.event_date)}
                      {event.time && ` o ${event.time}`}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.location}, {event.city}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {event.description}
                </p>
                <FlexBox variant="start" className="flex-wrap gap-1 mb-3">
                  {event.dance_styles?.slice(0, 2).map((style: string) => (
                    <Badge key={style} variant="outline" className="text-xs">
                      <Music className="w-3 h-3 mr-1" />
                      {style}
                    </Badge>
                  ))}
                  {event.dance_styles?.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{event.dance_styles.length - 2}
                    </Badge>
                  )}
                </FlexBox>
                <FlexBox className="text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-3 h-3" />
                    {event.attendees_count || 0} uczestników
                  </span>
                  {event.price ? (
                    <Badge variant="secondary">{event.price} PLN</Badge>
                  ) : (
                    <Badge variant="secondary">Bezpłatne</Badge>
                  )}
                </FlexBox>
              </CardContent>
              <CardFooter>
                <FlexBox className="w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => show("outdoor_events", event.id)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Szczegóły
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => edit("outdoor_events", event.id)}
                    disabled={isPast}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </FlexBox>
              </CardFooter>
            </Card>
          );
        })}
      </GridBox>

      <PaginationSwitch
        current={current}
        pageSize={pageSize}
        total={data?.total || 0}
        setCurrent={setCurrent}
        itemName="wydarzeń"
      />
    </>
  );
};