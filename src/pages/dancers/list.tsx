import { useTable, useNavigation } from "@refinedev/core";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  MapPin,
  Calendar,
  Award,
  Ruler,
  Music,
  Users,
  Search,
  Sparkles,
  GraduationCap,
  Heart,
  MessageCircle,
} from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { PaginationSwith } from "@/components/navigation";
import { Lead } from "@/components/reader";
import { useLoading } from "@/utility";
import { Badge, Button, Input } from "@/components/ui";
import { SubPage } from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
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

export const DancersList = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    tableQuery: { data, isLoading, isError },
    current,
    setCurrent,
    pageSize,
    setFilters,
  } = useTable({
    resource: "v_public_dancers",
    pagination: {
      pageSize: 12,
    },
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
    },
  });

  const { show } = useNavigation();

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value) {
      setFilters([
        {
          field: "name",
          operator: "contains" as any,
          value: value,
        },
      ]);
    } else {
      setFilters([]);
    }
  };

  const init = useLoading({ isLoading, isError });
  if (init) return init;

  const dancers = (data?.data as Dancer[]) || [];

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
      <FlexBox>
        <Lead
          title="Tancerze"
          description="Przeglądaj profile tancerzy w Twojej okolicy"
        />
      </FlexBox>

      <FlexBox>
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Szukaj tancerzy po imieniu..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">
            <Users className="w-3 h-3 mr-1" />
            {data?.total || 0} tancerzy
          </Badge>
        </div>
      </FlexBox>

      <GridBox variant="1-2-3">
        {dancers.map((dancer) => {
          return (
            <Card
              key={dancer.id}
              className="group relative overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => show("v_public_dancers", dancer.id)}
            >
              {/* Tło ze zdjęciem */}
              <div className="relative h-[400px] sm:h-[450px] overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100">
                {dancer.profile_photo_url ? (
                  <img
                    src={dancer.profile_photo_url}
                    alt={dancer.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                      <AvatarFallback className="text-4xl bg-gradient-to-br from-pink-400 to-purple-400 text-white">
                        {dancer.name?.charAt(0)?.toUpperCase() || "T"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Badge'y statusu po lewej stronie */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {dancer.is_verified && (
                    <Badge className="bg-blue-500/90 backdrop-blur-sm text-white border-0 shadow-lg">
                      <Award className="w-3 h-3 mr-1" />
                      Zweryfikowany
                    </Badge>
                  )}
                  {dancer.is_trainer && (
                    <Badge className="bg-purple-500/90 backdrop-blur-sm text-white border-0 shadow-lg">
                      <GraduationCap className="w-4 h-4 mr-1" />
                      Trener
                    </Badge>
                  )}
                  {/* Badge dopasowania */}
                  {dancer.is_matched && (
                    <Badge className="bg-green-500/90 backdrop-blur-sm text-white border-0 shadow-lg">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Dopasowanie!
                    </Badge>
                  )}
                  {/* Badge polubienia */}
                  {!dancer.is_matched && dancer.liked_me && (
                    <Badge className="bg-pink-500/90 backdrop-blur-sm text-white border-0 shadow-lg">
                      <Heart className="w-4 h-4 mr-1" />
                      Lubi Cię!
                    </Badge>
                  )}
                </div>

                {/* Przycisk polubienia po prawej */}
                <div className="absolute top-3 right-3">
                  <LikeButton
                    targetUserId={dancer.id}
                    variant="card"
                    initialLiked={dancer.i_liked}
                  />
                </div>

                {/* Informacje na dole */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-2xl font-bold mb-1">
                    {dancer.name}
                    {dancer.age && `, ${dancer.age}`}
                  </h3>

                  <div className="flex items-center gap-3 text-sm mb-2 opacity-90">
                    {dancer.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {dancer.city}
                      </span>
                    )}
                    {dancer.height && (
                      <span className="flex items-center gap-1">
                        <Ruler className="w-3 h-3" />
                        {dancer.height} cm
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  {dancer.bio && (
                    <p className="text-sm opacity-90 line-clamp-2 mb-3">
                      {dancer.bio}
                    </p>
                  )}

                  {/* Style tańca */}
                  {dancer.dance_styles && dancer.dance_styles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {dancer.dance_styles.slice(0, 3).map((style, index) => (
                        <Badge
                          key={index}
                          className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs"
                        >
                          <Music className="w-3 h-3 mr-1" />
                          {style.style_name}
                        </Badge>
                      ))}
                      {dancer.dance_styles.length > 3 && (
                        <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs">
                          +{dancer.dance_styles.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Akcje na dole karty */}
              <CardContent className="p-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Tutaj możesz dodać funkcjonalność wiadomości
                      }}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        show("v_public_dancers", dancer.id);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {dancer.is_matched ? (
                      <>
                        <MessageCircle className="w-3 h-3 text-green-500" />
                        <span className="text-green-600 font-medium">
                          Możesz pisać!
                        </span>
                      </>
                    ) : dancer.liked_me ? (
                      <>
                        <Heart className="w-3 h-3 text-pink-500" />
                        <span className="text-pink-600 font-medium">
                          Czeka na polubienie
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>Aktywny dzisiaj</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </GridBox>

      {dancers.length === 0 && (
        <Card className="p-12 text-center border-dashed">
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Nie znaleziono tancerzy
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Spróbuj zmienić kryteria wyszukiwania"
              : "Brak dostępnych profili w tym momencie"}
          </p>
        </Card>
      )}

      <PaginationSwith
        current={current}
        pageSize={pageSize}
        total={data?.total || 0}
        setCurrent={setCurrent}
        itemName="tancerzy"
      />
    </SubPage>
  );
};
