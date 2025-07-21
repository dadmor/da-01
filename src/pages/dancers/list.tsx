// src/pages/dancers/list.tsx
import { useTable, useNavigation, useGetIdentity } from "@refinedev/core";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Eye, MapPin, Music, Search, Heart } from "lucide-react";
import { FlexBox } from "@/components/shared";
import { PaginationSwitch } from "@/components/navigation";
import { Lead } from "@/components/reader";
import { useLoading } from "@/utility";
import { Badge, Button, Input } from "@/components/ui";
import { DancerLikeButton } from "./DancerLikeButton";
import { useState, useEffect } from "react";

export const DancersList = () => {
  const { data: identity } = useGetIdentity();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    tableQuery: { data, isLoading, isError },
    current,
    setCurrent,
    pageSize,
  } = useTable({
    resource: "dancers",
    meta: {
      select: '*, dancer_dance_styles(skill_level, dance_styles(name))'
    },
    filters: [
      {
        field: "name",
        operator: "contains",
        value: debouncedSearchTerm,
      },
    ],
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
    },
    pagination: {
      pageSize: 12,
    },
  });
  
  const { show } = useNavigation();
  const init = useLoading({ isLoading, isError });

  if (init) return init;

  // Funkcja do obliczania wieku z daty urodzenia
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Funkcja do mapowania poziomu umiejętności
  const getSkillLevelLabel = (level: string) => {
    const levels: Record<string, string> = {
      beginner: 'Początkujący',
      intermediate: 'Średniozaawansowany',
      advanced: 'Zaawansowany',
      professional: 'Profesjonalny'
    };
    return levels[level] || level;
  };

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
      <Lead
        title="Tancerze"
        description="Przeglądaj profile tancerzy i znajdź swojego partnera tanecznego"
        className="mb-6 md:mb-8"
      />

      {/* Search Bar */}
      <div className="relative max-w-md mx-auto md:max-w-xl lg:max-w-2xl mb-6 md:mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Szukaj tancerzy po imieniu..."
          className="pl-10 h-10 md:h-11 lg:h-12 text-sm md:text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Dancers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {data?.data?.map((dancer: any) => {
          const age = calculateAge(dancer.birth_date);
          const danceStyles = dancer.dancer_dance_styles?.map((ds: any) => ({
            name: ds.dance_styles?.name,
            level: ds.skill_level
          })).filter((ds: any) => ds.name) || [];
          
          // Nie pokazuj własnego profilu
          const isOwnProfile = identity?.id === dancer.user_id;
          if (isOwnProfile) return null;
          
          return (
            <Card key={dancer.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="p-0">
                <div className="relative aspect-[3/4] md:aspect-[4/5]">
                  <img
                    src={dancer.profile_photo_url || "/placeholder-dancer.jpg"}
                    alt={dancer.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-dancer.jpg";
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 md:p-5">
                    <h3 className="text-xl md:text-2xl font-bold text-white">
                      {dancer.name}{dancer.show_age !== false && age ? `, ${age}` : ""}
                    </h3>
                    {dancer.show_exact_location !== false && (
                      <p className="text-white/90 flex items-center gap-1.5 mt-1 text-sm md:text-base">
                        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                        <span className="truncate">
                          {dancer.city || dancer.location_address || "Nieznane"}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 md:p-5">
                {/* Dance Styles */}
                {danceStyles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {danceStyles.slice(0, 3).map((style: any, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs md:text-sm py-0.5 px-2">
                        <Music className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />
                        {style.name}
                      </Badge>
                    ))}
                    {danceStyles.length > 3 && (
                      <Badge variant="outline" className="text-xs md:text-sm py-0.5 px-2">
                        +{danceStyles.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Bio */}
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                  {dancer.bio || "Brak opisu profilu"}
                </p>
                
                {/* Additional Info */}
                {dancer.search_radius_km && (
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Zasięg: {dancer.search_radius_km} km
                  </p>
                )}
              </CardContent>
              
              <CardFooter className="p-4 md:p-5 pt-0">
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 md:h-9 text-xs md:text-sm"
                    onClick={() => show("dancers", dancer.id)}
                  >
                    <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" />
                    Profil
                  </Button>
                  {identity && (
                    <DancerLikeButton
                      targetDancerId={dancer.id}
                      className="flex-1 h-8 md:h-9 text-xs md:text-sm"
                      size="sm"
                    />
                  )}
                </div>
              </CardFooter>
            </Card>
          );
        }).filter(Boolean)}
      </div>

      {/* Empty State */}
      {data?.data?.length === 0 && (
        <div className="text-center py-12 md:py-16">
          <p className="text-muted-foreground text-base md:text-lg">
            Nie znaleziono żadnych tancerzy
          </p>
        </div>
      )}

      {/* Pagination */}
      {data && data.total > pageSize && (
        <div className="mt-8 md:mt-12">
          <PaginationSwitch
            current={current}
            pageSize={pageSize}
            total={data.total || 0}
            setCurrent={setCurrent}
            itemName="tancerzy"
          />
        </div>
      )}
    </div>
  );
};