// ------ src/pages/dancers/show.tsx ------
import { useShow, useNavigation } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  Award,
  Ruler,
  Music,
  GraduationCap,
} from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Badge, Button, Separator } from "@/components/ui";
import { useLoading } from "@/utility";
import { SubPage } from "@/components/layout";

export const DancersShow = () => {
  const { queryResult } = useShow({
    resource: "v_public_dancers",
  });
  const { list } = useNavigation();

  const { data, isLoading, isError } = queryResult;
  const record = data?.data;

  const init = useLoading({ isLoading, isError });
  if (init) return init;

  if (!record) {
    return (
      <div className="p-6 mx-auto">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Profil nie został znaleziony</p>
          <Button className="mt-4" onClick={() => list("v_public_dancers")}>
            Wróć do listy
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SubPage>
      DANCERS REDUNDAND PROFILE
      <Button
        variant="outline"
        size="sm"
        onClick={() => list("v_public_dancers")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Wróć do listy
      </Button>

      <FlexBox>
        <Lead
          title={
            <FlexBox variant="start" className="gap-2">
              {record.name}
              {record.is_verified && (
                <><Award className="w-5 h-5 text-blue-500" />
                Zweryfikowany profil</>
              )}
            </FlexBox>
          }
          description={`Profil tancerza`}
        />
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
                {record.age && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Wiek</p>
                      <p className="text-sm text-muted-foreground">{record.age} lat</p>
                    </div>
                  </div>
                )}

                {record.height && (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Wzrost</p>
                      <p className="text-sm text-muted-foreground">{record.height} cm</p>
                    </div>
                  </div>
                )}

                {record.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Miasto</p>
                      <p className="text-sm text-muted-foreground">{record.city}</p>
                    </div>
                  </div>
                )}

                {record.is_trainer && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <Badge variant="secondary">Trener</Badge>
                    </div>
                  </div>
                )}
              </div>

              {record.bio && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">O mnie</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {record.bio}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Style taneczne */}
          {record.dance_styles?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Style taneczne ({record.dance_styles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {record.dance_styles.map((style: any, index: number) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{style.style_name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          Poziom: {style.skill_level}
                        </p>
                      </div>
                      {style.is_teaching && (
                        <Badge variant="outline">Uczy</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Panel boczny */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Szczegóły profilu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Dołączył</p>
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

                <div className="space-y-2">
                  <p className="text-sm font-medium">Status profilu</p>
                  <div className="flex flex-wrap gap-2">
                    {record.is_verified && (
                      <Badge variant="secondary">
                        <Award className="w-3 h-3 mr-1" />
                        Zweryfikowany
                      </Badge>
                    )}
                    {record.is_trainer && (
                      <Badge variant="secondary">
                        <GraduationCap className="w-3 h-3 mr-1" />
                        Trener
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </GridBox>
    </SubPage>
  );
};