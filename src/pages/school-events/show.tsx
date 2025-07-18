// src/pages/school-events/show.tsx
import { useShow, useNavigation, useDelete, useCreate } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Users,
  DollarSign,
  GraduationCap,
  Music,
  Trophy,
  UserPlus,
} from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Badge, Button, Separator } from "@/components/ui";
import { useLoading } from "@/utility";
import { useState } from "react";

export const SchoolEventsShow = () => {
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
          <Button className="mt-4" onClick={() => list("school_events")}>
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
          resource: "school_events",
          id: record.id,
        },
        {
          onSuccess: () => {
            list("school_events");
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
          event_type: "school",
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
  const isFull = record.max_participants && record.attendees_count >= record.max_participants;

  const eventTypeLabel = {
    workshop: "Warsztaty",
    party: "Impreza",
    course: "Kurs",
    bootcamp: "Bootcamp",
  }[record.type] || record.type;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => list("school_events")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Powrót do listy
      </Button>

      <FlexBox>
        <Lead
          title={record.name}
          description={`${eventTypeLabel} • ID: #${String(record.id).slice(0, 8)}`}
        />
        <FlexBox className="gap-2">
          {!isPast && !isJoined && !isFull && (
            <Button onClick={handleJoin}>
              <UserPlus className="w-4 h-4 mr-2" />
              Zapisz się
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              if (record?.id != null) {
                edit("school_events", record.id);
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
          {/* Event Info */}
          <Card>
            <CardHeader>
              <FlexBox>
                <CardTitle>Informacje o wydarzeniu</CardTitle>
                <div className="flex gap-2">
                  <Badge variant={record.type === "workshop" ? "default" : "outline"}>
                    {eventTypeLabel}
                  </Badge>
                  {isPast && (
                    <Badge variant="secondary">Zakończone</Badge>
                  )}
                  {isToday && (
                    <Badge className="bg-green-500 text-white">Dzisiaj!</Badge>
                  )}
                  {isFull && !isPast && (
                    <Badge variant="destructive">Brak miejsc</Badge>
                  )}
                </div>
              </FlexBox>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Organizator</p>
                    <p className="font-medium">{record.school?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {record.school?.address}, {record.school?.city}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium">
                      {eventDate.toLocaleDateString("pl-PL", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Godzina</p>
                    <p className="font-medium">
                      {record.time}
                      {record.duration && ` (${record.duration})`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Poziom</p>
                    <p className="font-medium">{record.skill_level}</p>
                  </div>
                </div>

                {record.instructor && (
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Instruktor</p>
                      <p className="font-medium">{record.instructor}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cena</p>
                    <p className="font-medium">
                      {record.price > 0 ? `${record.price} PLN` : "Bezpłatne"}
                    </p>
                  </div>
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

          {/* Program (for workshops) */}
          {record.type === "workshop" && record.program && (
            <Card>
              <CardHeader>
                <CardTitle>Program warsztatów</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {record.program}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Course Info */}
          {record.type === "course" && (
            <Card>
              <CardHeader>
                <CardTitle>Informacje o kursie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {record.course_sessions && (
                  <div>
                    <p className="text-sm text-muted-foreground">Liczba zajęć</p>
                    <p className="font-medium">{record.course_sessions}</p>
                  </div>
                )}
                {record.course_schedule && (
                  <div>
                    <p className="text-sm text-muted-foreground">Harmonogram</p>
                    <p className="font-medium">{record.course_schedule}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {record.requirements && (
            <Card>
              <CardHeader>
                <CardTitle>Wymagania</CardTitle>
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
          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Uczestnicy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {record.attendees_count || 0}
                    {record.max_participants && (
                      <span className="text-lg text-muted-foreground">
                        /{record.max_participants}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">zapisanych uczestników</p>
                </div>
                {record.max_participants && (
                  <>
                    <Separator />
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            ((record.attendees_count || 0) / record.max_participants) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      {record.max_participants - (record.attendees_count || 0)} wolnych miejsc
                    </p>
                  </>
                )}
                {isJoined && (
                  <>
                    <Separator />
                    <Badge className="w-full justify-center py-2 bg-green-500">
                      Jesteś zapisany!
                    </Badge>
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
                {!isJoined && !isFull && (
                  <Button className="w-full" onClick={handleJoin}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Zapisz się na wydarzenie
                  </Button>
                )}
                <Button className="w-full" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Dodaj do kalendarza
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    // Navigate to school profile
                    if (record.school_id) {
                      show("dance_schools", record.school_id);
                    }
                  }}
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Zobacz szkołę
                </Button>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </GridBox>
    </>
  );
};