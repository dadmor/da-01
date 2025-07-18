// src/pages/dancers/show.tsx
import { useShow, useNavigation, useDelete, useList } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Edit,
  Trash2,
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
  const { queryResult } = useShow();
  const { list, edit } = useNavigation();
  const { mutate: deleteDancer } = useDelete();

  const { data, isLoading, isError } = queryResult;
  const record = data?.data;

  // Fetch matches for this dancer
  const { data: matchesData } = useList({
    resource: "matches",
    filters: [
      {
        field: "dancer_id",
        operator: "eq",
        value: record?.id,
      },
    ],
    pagination: { mode: "off" },
  });

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

  const handleDelete = () => {
    if (
      record?.id &&
      confirm("Czy na pewno chcesz usunąć ten profil? Ta akcja jest nieodwracalna.")
    ) {
      deleteDancer(
        {
          resource: "dancers",
          id: record.id,
        },
        {
          onSuccess: () => {
            list("dancers");
          },
        }
      );
    }
  };

  const handleLike = () => {
    // Logika polubienia
    console.log("Liked dancer:", record.id);
  };

  const handleMessage = () => {
    // Logika rozpoczęcia czatu
    console.log("Start chat with:", record.id);
  };

  const matches = matchesData?.data || [];

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
          description={`Profil tancerza • ID: #${String(record.id).slice(0, 8)}`}
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
          <Button
            variant="outline"
            onClick={() => {
              if (record?.id != null) {
                edit("dancers", record.id);
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
          {/* Profile Photo and Basic Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={record.photo_url} />
                  <AvatarFallback className="text-4xl">{record.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold">{record.name}, {record.age}</h2>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4" />
                      {record.city}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      {record.experience_level}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {record.looking_for}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
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

          {/* Recent Matches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Ostatnie dopasowania ({matches.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {matches.length > 0 ? (
                <div className="space-y-3">
                  {matches.slice(0, 5).map((match: any) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={match.matched_dancer?.photo_url} />
                          <AvatarFallback>{match.matched_dancer?.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{match.matched_dancer?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(match.created_at).toLocaleDateString("pl-PL")}
                          </p>
                        </div>
                      </div>
                      <Badge variant={match.status === "mutual" ? "default" : "outline"}>
                        {match.status === "mutual" ? "Wzajemne" : "Oczekujące"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Brak dopasowań
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statystyki profilu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Wyświetlenia profilu</span>
                  <span className="font-medium">{record.profile_views || 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Polubienia</span>
                  <span className="font-medium">{record.likes_received || 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Dopasowania</span>
                  <span className="font-medium">{matches.filter((m: any) => m.status === "mutual").length}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Wiadomości</span>
                  <span className="font-medium">{record.messages_count || 0}</span>
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
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Ostatnia aktywność</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.last_active || record.updated_at).toLocaleDateString("pl-PL", {
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
              <Button className="w-full" onClick={handleLike}>
                <Heart className="w-4 h-4 mr-2" />
                Polub profil
              </Button>
              <Button className="w-full" variant="outline" onClick={handleMessage}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Rozpocznij czat
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  if (record?.id != null) {
                    edit("dancers", record.id);
                  }
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edytuj profil
              </Button>
            </CardContent>
          </Card>
        </div>
      </GridBox>
    </>
  );
};