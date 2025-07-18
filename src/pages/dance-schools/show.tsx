// src/pages/dance-schools/show.tsx
import { useShow, useNavigation, useDelete, useList } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Music,
  Phone,
  Mail,
  Globe,
  DollarSign,
  Users,
  Star,
} from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Badge, Button, Separator } from "@/components/ui";
import { useLoading } from "@/utility";

export const DanceSchoolsShow = () => {
  const { queryResult } = useShow();
  const { list, edit } = useNavigation();
  const { mutate: deleteSchool } = useDelete();

  const { data, isLoading, isError } = queryResult;
  const record = data?.data;

  // Fetch school events
  const { data: eventsData } = useList({
    resource: "school_events",
    filters: [
      {
        field: "school_id",
        operator: "eq",
        value: record?.id,
      },
    ],
    pagination: { pageSize: 5 },
    sorters: [{ field: "event_date", order: "asc" }],
  });

  const init = useLoading({ isLoading, isError });
  if (init) return init;

  if (!record) {
    return (
      <div className="p-6 mx-auto">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Szkoła nie znaleziona</p>
          <Button className="mt-4" onClick={() => list("dance_schools")}>
            Powrót do listy
          </Button>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    if (
      record?.id &&
      confirm("Czy na pewno chcesz usunąć tę szkołę? Ta akcja jest nieodwracalna.")
    ) {
      deleteSchool(
        {
          resource: "dance_schools",
          id: record.id,
        },
        {
          onSuccess: () => {
            list("dance_schools");
          },
        }
      );
    }
  };

  const events = eventsData?.data || [];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => list("dance_schools")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Powrót do listy
      </Button>

      <FlexBox>
        <Lead
          title={record.name}
          description={`Szkoła tańca • ID: #${String(record.id).slice(0, 8)}`}
        />
        <FlexBox className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (record?.id != null) {
                edit("dance_schools", record.id);
              }
            }}
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
          {/* School Overview */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                {record.logo_url && (
                  <img
                    src={record.logo_url}
                    alt={record.name}
                    className="w-32 h-32 object-contain rounded-lg border"
                  />
                )}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold">{record.name}</h2>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4" />
                      {record.address}, {record.city}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {record.rating || "4.5"} / 5.0
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {record.price_range}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {record.students_count || 0} uczniów
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>O szkole</CardTitle>
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
                Oferowane style tańca
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

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Nadchodzące wydarzenia ({events.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <div className="space-y-3">
                  {events.map((event: any) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">{event.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.event_date).toLocaleDateString("pl-PL", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                          {event.time && ` o ${event.time}`}
                        </p>
                      </div>
                      <Badge variant={event.type === "workshop" ? "default" : "outline"}>
                        {event.type === "workshop" ? "Warsztaty" : "Impreza"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Brak zaplanowanych wydarzeń
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kontakt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Telefon</p>
                  <a href={`tel:${record.phone}`} className="text-sm text-blue-600 hover:underline">
                    {record.phone}
                  </a>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a href={`mailto:${record.email}`} className="text-sm text-blue-600 hover:underline">
                    {record.email}
                  </a>
                </div>
              </div>
              {record.website && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Strona internetowa</p>
                      <a
                        href={record.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {record.website}
                      </a>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statystyki</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Uczniowie</span>
                  <span className="font-medium">{record.students_count || 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Instruktorzy</span>
                  <span className="font-medium">{record.instructors_count || 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Sale taneczne</span>
                  <span className="font-medium">{record.dance_rooms || 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Wydarzenia w tym miesiącu</span>
                  <span className="font-medium">{events.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

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
                <Separator />
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Ostatnia aktualizacja</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.updated_at).toLocaleDateString("pl-PL", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Szybkie akcje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full">
                <Users className="w-4 h-4 mr-2" />
                Zapisz się na zajęcia
              </Button>
              <Button className="w-full" variant="outline">
                <Phone className="w-4 h-4 mr-2" />
                Zadzwoń do szkoły
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  if (record?.id != null) {
                    edit("dance_schools", record.id);
                  }
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edytuj dane
              </Button>
            </CardContent>
          </Card>
        </div>
      </GridBox>
    </>
  );
};