// src/pages/dancers/show.tsx
import { useShow, useNavigation } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Music,
  Heart,
  MessageCircle,
  Trophy,
  Target,
} from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Badge, Button, Separator } from "@/components/ui";
import { useLoading } from "@/utility";

export const DancersShow = () => {
  const { queryResult } = useShow({
    meta: {
      select: '*, dancer_dance_styles(skill_level, dance_styles(name))'
    }
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
          <p className="text-red-500 text-lg">Profil nie znaleziony</p>
          <Button className="mt-4" onClick={() => list("dancers")}>
            Powrót do listy
          </Button>
        </div>
      </div>
    );
  }

  const handleLike = () => {
    // TODO: Implementacja polubienia przez matches API
    console.log("Liked dancer:", record.id);
  };

  const handleMessage = () => {
    // TODO: Implementacja czatu
    console.log("Start chat with:", record.id);
  };

  // Oblicz wiek
  const age = record.birth_date ? 
    Math.floor((new Date().getTime() - new Date(record.birth_date).getTime()) / 31557600000) : 
    null;

  // Wyciągnij style tańca
  const danceStyles = record.dancer_dance_styles?.map((ds: any) => ({
    name: ds.dance_styles?.name,
    level: ds.skill_level
  })).filter((ds: any) => ds.name) || [];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => list("dancers")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Powrót do listy
      </Button>

      <FlexBox>
        <Lead
          title={record.name}
          description={`Profil tancerza`}
        />
        <FlexBox className="gap-2">
          <Button variant="outline" onClick={handleMessage}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Napisz
          </Button>
          <Button onClick={handleLike}>
            <Heart className="w-4 h-4 mr-2" />
            Polub
          </Button>
        </FlexBox>
      </FlexBox>

      <GridBox>
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Photo and Basic Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={record.profile_photo_url} />
                  <AvatarFallback className="text-4xl">{record.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {record.name}{age ? `, ${age}` : ""}
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4" />
                      {record.city || record.location_address || "Nieznane"}
                    </p>
                  </div>
                  {record.visibility && (
                    <Badge variant="secondary">
                      {record.visibility === 'public' ? 'Profil publiczny' : 'Profil prywatny'}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          {record.bio && (
            <Card>
              <CardHeader>
                <CardTitle>O mnie</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {record.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Dance Styles */}
          {danceStyles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Style tańca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {danceStyles.map((style: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge>{style.name}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Poziom: {
                          style.level === 'beginner' ? 'Początkujący' :
                          style.level === 'intermediate' ? 'Średniozaawansowany' :
                          style.level === 'advanced' ? 'Zaawansowany' :
                          style.level === 'professional' ? 'Profesjonalny' :
                          style.level
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Akcje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" onClick={handleLike}>
                <Heart className="w-4 h-4 mr-2" />
                Polub profil
              </Button>
              <Button className="w-full" variant="outline" onClick={handleMessage}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Rozpocznij czat
              </Button>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informacje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {record.search_radius_km && (
                  <>
                    <div>
                      <p className="text-sm font-medium">Zasięg poszukiwań</p>
                      <p className="text-sm text-muted-foreground">
                        {record.search_radius_km} km
                      </p>
                    </div>
                    <Separator />
                  </>
                )}
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
              </div>
            </CardContent>
          </Card>
        </div>
      </GridBox>
    </>
  );
};