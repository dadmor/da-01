// ------ src/pages/profiles/show.tsx ------
import { useGetIdentity, useOne } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Edit,
  User,
  MapPin,
  Calendar,
  Award,
  Ruler,
  Mail,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Badge, Button, Separator } from "@/components/ui";
import { useLoading } from "@/utility";
import { SubPage } from "@/components/layout";

export const ProfileShow = () => {
  const { data: identity } = useGetIdentity();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useOne({
    resource: "users",
    id: identity?.id || "",
    queryOptions: {
      enabled: !!identity?.id,
    },
  });

  const record = data?.data;
  const init = useLoading({ isLoading, isError });
  if (init) return init;

  if (!record) {
    return (
      <div className="p-6 mx-auto">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Nie znaleziono profilu</p>
        </div>
      </div>
    );
  }

  return (
    <SubPage>
      <FlexBox>
        <Lead title="Mój Profil" description="Podgląd Twojego profilu" />
        <Button onClick={() => navigate("/profiles/edit")}>
          <Edit className="w-4 h-4 mr-2" />
          Edytuj profil
        </Button>
      </FlexBox>

      <GridBox>
        {/* Główne informacje */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informacje podstawowe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Imię i nazwisko</p>
                  <p className="text-lg">{record.name}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-lg flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {record.email}
                  </p>
                </div>

                {record.birth_date && (
                  <div>
                    <p className="text-sm font-medium">Wiek</p>
                    <p className="text-lg flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date().getFullYear() -
                        new Date(record.birth_date).getFullYear()}{" "}
                      lat
                    </p>
                  </div>
                )}

                {record.height && (
                  <div>
                    <p className="text-sm font-medium">Wzrost</p>
                    <p className="text-lg flex items-center gap-2">
                      <Ruler className="w-4 h-4" />
                      {record.height} cm
                    </p>
                  </div>
                )}
              </div>

              {record.bio && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">O mnie</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {record.bio}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex flex-wrap gap-2">
                {record.is_trainer && (
                  <Badge variant="secondary">
                    <Award className="w-3 h-3 mr-1" />
                    Trener
                  </Badge>
                )}
                {record.is_school_owner && (
                  <Badge variant="secondary">
                    <Award className="w-3 h-3 mr-1" />
                    Właściciel szkoły
                  </Badge>
                )}
                {record.is_verified && (
                  <Badge variant="default">
                    <Shield className="w-3 h-3 mr-1" />
                    Zweryfikowany
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Lokalizacja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {record.city && (
                <div>
                  <p className="text-sm font-medium">Miasto</p>
                  <p className="text-lg">{record.city}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Promień wyszukiwania</p>
                <p className="text-lg">{record.search_radius_km} km</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel boczny */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ustawienia prywatności</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Widoczność profilu</span>
                <Badge variant="outline" className="capitalize">
                  {record.visibility === "public"
                    ? "Publiczny"
                    : record.visibility === "friends"
                    ? "Znajomi"
                    : "Prywatny"}
                </Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  {record.show_age ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3" />
                  )}
                  Pokazuj wiek
                </span>
                <span className="text-sm font-medium">
                  {record.show_age ? "Tak" : "Nie"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  {record.show_exact_location ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3" />
                  )}
                  Dokładna lokalizacja
                </span>
                <span className="text-sm font-medium">
                  {record.show_exact_location ? "Tak" : "Nie"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status konta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <Badge variant={record.is_active ? "default" : "secondary"}>
                  {record.is_active ? "Aktywny" : "Nieaktywny"}
                </Badge>
              </div>

              <Separator />

              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  Utworzono:{" "}
                  {new Date(record.created_at).toLocaleDateString("pl-PL")}
                </p>
                <p>
                  Ostatnia aktualizacja:{" "}
                  {new Date(record.updated_at).toLocaleDateString("pl-PL")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </GridBox>
    </SubPage>
  );
};
