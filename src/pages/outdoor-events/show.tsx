// src/pages/outdoor-events/show.tsx
import { useShow, useNavigation, useDelete, useCreate } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Music,
  Users,
  Clock,
  DollarSign,
  Sun,
  Link,
  UserPlus,
} from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Badge, Button, Separator } from "@/components/ui";
import { useLoading } from "@/utility";
import { useState } from "react";

export const OutdoorEventsShow = () => {
  const { queryResult } = useShow();
  const { list, edit } = useNavigation();
  const { mutate: deleteEvent } = useDelete();
  const { mutate: joinEvent } = useCreate();
  const [isJoined, setIsJoined] = useState(false);

  const { data, isLoading, isError } = queryResult;
  const record = data?.data;

  const init = useLoading({ isLoading, isError });
  if (init) return init;

  if (!record) {
    return (
      <div className="p-6 mx-auto">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Wydarzenie nie znalezione</p>
          <Button className="mt-4" onClick={() => list("outdoor_events")}>
            Powrót do listy
          </Button>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    if (
      record?.id &&
      confirm("Czy na pewno chcesz usunąć to wydarzenie? Ta akcja jest nieodwracalna.")
    ) {
      deleteEvent(
        {
          resource: "outdoor_events",
          id: record.id,
        },
        {
          onSuccess: () => {
            list("outdoor_events");
          },
        }
      );
    }
  };

  const handleJoin = () => {
    joinEvent(
      {
        resource: "event_attendees",
        values: {
          event_id: record.id,
          event_type: "outdoor",
        },
      },
      {
        onSuccess: () => {
          setIsJoined(true);
        },
      }
    );
  };

  const eventDate = new Date(record.event_date);
  const isPast = eventDate < new Date();
  const isToday = eventDate.toDateString() === new Date().toDateString();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => list("outdoor_events")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Powrót do listy
      </Button>

      <FlexBox>
        <Lead
          title={record.name}
          description={`Wydarzenie plenerowe • ID: #${String(record.id).slice(0, 8)}`}
        />
        <FlexBox className="gap-2">
          {!isPast && !isJoined && (
            <Button onClick={handleJoin}>
              <UserPlus className="w-4 h-4 mr-2" />
              Dołącz
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              if (record?.id != null) {
                edit("outdoor_events", record.id);
              }
            }}
            disabled={isPast}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edytuj
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Usuń
          </Button>
        </FlexBox>
      </FlexBox>

      <GridBox>
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Cover and Info */}
          <Card>
            {record.cover_image && (
              <div className="h-64 relative">
                <img
                  src={record.cover_image}
                  alt={record.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge className="bg-yellow-500 text-white">
                    <Sun className="w-3 h-3 mr-1" />
                    Plenerowe
                  </Badge>
                  {isPast && (
                    <Badge variant="secondary">Zakończone</Badge>
                  )}
                  {isToday && (
                    <Badge className="bg-green-500 text-white">Dzisiaj!</Badge>
                  )}
                </div>
              </div>
            )}
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{record.name}</h2>
                  <Badge variant="outline" className="mt-2">
                    {record.event_type}
                  </Badge>
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {eventDate.toLocaleDateString("pl-PL", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{record.time}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{record.location}, {record.city}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {record.price > 0 ? `${record.price} PLN` : "Bezpłatne"}
                    </span>
                  </div>
                  {record.event_link && (
                    <div className="flex items-center gap-3">
                      <Link className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={record.event_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Link do wydarzenia
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Opis wydarzenia</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {record.description}
              </p>
            </CardContent>
          </Card>

          {/* Dance Styles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5" />
                Style tańca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {record.dance_styles?.map((style: string, index: number) => (
                  <Badge key={index} className="text-sm">
                    {style}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          {record.requirements && (
            <Card>
              <CardHeader>
                <CardTitle>Informacje organizacyjne</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {record.requirements}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statystyki</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    Uczestnicy
                  </span>
                  <span className="font-medium">
                    {record.attendees_count || 0}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={isPast ? "secondary" : isToday ? "default" : "outline"}>
                    {isPast ? "Zakończone" : isToday ? "Dzisiaj" : "Nadchodzące"}
                  </Badge>
                </div>
                {isJoined && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Twój status</span>
                      <Badge className="bg-green-500">Zapisany</Badge>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {!isPast && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Szybkie akcje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!isJoined && (
                  <Button className="w-full" onClick={handleJoin}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Dołącz do wydarzenia
                  </Button>
                )}
                <Button className="w-full" variant="outline">
                  <MapPin className="w-4 h-4 mr-2" />
                  Pokaż na mapie
                </Button>
                {record.event_link && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => window.open(record.event_link, "_blank")}
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Otwórz link wydarzenia
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informacje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Dodano</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.created_at).toLocaleDateString("pl-PL", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {record.organizer && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Organizator</p>
                        <p className="text-sm text-muted-foreground">
                          {record.organizer.name}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </GridBox>
    </>
  );
};