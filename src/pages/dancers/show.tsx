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
  Heart,
  Sparkles,
} from "lucide-react";
import { GridBox } from "@/components/shared";
import { Badge, Button, Separator } from "@/components/ui";
import { useLoading } from "@/utility";
import { SubPage } from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LikeButton } from "./LikeButton";

interface DanceStyle {
  style_id: string;
  style_name: string;
  skill_level: string;
  is_teaching: boolean;
}

interface Dancer {
  id: string;
  name: string;
  bio?: string;
  age?: number;
  height?: number;
  profile_photo_url?: string;
  location_lat?: number;
  location_lng?: number;
  city?: string;
  is_trainer: boolean;
  is_verified: boolean;
  created_at: string;
  dance_styles?: DanceStyle[];
  i_liked: boolean;
  liked_me: boolean;
  is_matched: boolean;
}

export const DancersShow = () => {
  const { queryResult } = useShow({
    resource: "v_public_dancers",
  });
  const { list } = useNavigation();

  const { data, isLoading, isError } = queryResult;
  const record = data?.data as Dancer;

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

  // Funkcja do określenia poziomu umiejętności po polsku
  const getSkillLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      beginner: "Początkujący",
      intermediate: "Średniozaawansowany",
      advanced: "Zaawansowany",
      professional: "Profesjonalny",
    };
    return labels[level] || level;
  };

  return (
    <SubPage>
      <Button
        variant="outline"
        size="sm"
        onClick={() => list("v_public_dancers")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Wróć do listy
      </Button>

      {/* Nagłówek z avatarem i podstawowymi informacjami */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <Avatar className="h-24 w-24 flex-shrink-0">
              <AvatarImage src={record.profile_photo_url || undefined} />
              <AvatarFallback className="text-2xl">
                {record.name?.charAt(0)?.toUpperCase() || "T"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
                  {record.name}
                  {record.is_verified && (
                    <Badge variant="secondary">
                      <Award className="w-4 h-4 mr-1" />
                      Zweryfikowany
                    </Badge>
                  )}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-muted-foreground mt-2">
                  {record.age && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {record.age} lat
                    </span>
                  )}
                  {record.height && (
                    <span className="flex items-center gap-1">
                      <Ruler className="w-4 h-4" />
                      {record.height} cm
                    </span>
                  )}
                  {record.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {record.city}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {record.is_trainer && (
                  <Badge variant="secondary">
                    <GraduationCap className="w-4 h-4 mr-1" />
                    Trener
                  </Badge>
                )}
                {record.is_matched && (
                  <Badge variant="default" className="bg-green-500">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Dopasowanie!
                  </Badge>
                )}
                {!record.is_matched && record.liked_me && (
                  <Badge variant="default" className="bg-pink-500">
                    <Heart className="w-4 h-4 mr-1" />
                    Lubi Cię!
                  </Badge>
                )}
              </div>

              {/* Przycisk polubienia */}
              <LikeButton
                targetUserId={record.id}
                variant="default"
                initialLiked={record.i_liked}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <GridBox>
        {/* Główne informacje */}
        <div className="lg:col-span-2 space-y-6">
          {/* O mnie */}
          {record.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />O mnie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{record.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Style taneczne */}
          {record.dance_styles && record.dance_styles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Style taneczne ({record.dance_styles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {record.dance_styles.map((style, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{style.style_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Poziom: {getSkillLevelLabel(style.skill_level)}
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
                    {record.is_matched && (
                      <Badge variant="default" className="bg-green-500">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Dopasowanie
                      </Badge>
                    )}
                    {!record.is_matched && record.liked_me && (
                      <Badge variant="default" className="bg-pink-500">
                        <Heart className="w-3 h-3 mr-1" />
                        Lubi Cię
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Akcje */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Akcje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <LikeButton
                targetUserId={record.id}
                variant="default"
                className="w-full"
                initialLiked={record.i_liked}
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={!record.is_matched}
              >
                {record.is_matched
                  ? "Wyślij wiadomość"
                  : "Najpierw musicie się dopasować"}
              </Button>
              <Button variant="outline" className="w-full">
                Zgłoś profil
              </Button>
            </CardContent>
          </Card>
        </div>
      </GridBox>
    </SubPage>
  );
};
