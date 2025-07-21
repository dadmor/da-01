// src/pages/dancers/list.tsx
import { useTable, useNavigation } from "@refinedev/core";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Eye, Heart, MapPin, Music } from "lucide-react";
import { FlexBox } from "@/components/shared";
import { PaginationSwitch } from "@/components/navigation";
import { Lead } from "@/components/reader";
import { useLoading } from "@/utility";
import { Badge, Button, Input } from "@/components/ui";

export const DancersList = () => {
  const {
    tableQuery: { data, isLoading, isError },
    current,
    setCurrent,
    pageSize,
    setFilters,
  } = useTable({
    resource: "dancers",
    meta: {
      select: '*, dancer_dance_styles(skill_level, dance_styles(name))'
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
  const init = useLoading({ isLoading, isError });

  if (init) return init;

  const handleLike = async (dancerId: string) => {
    console.log("Liked dancer:", dancerId);
  };

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

  return (
    <>
      <Lead
        title="Tancerze"
        description="Przeglądaj profile tancerzy i znajdź swojego partnera tanecznego"
      />

      <Input
        placeholder="Szukaj tancerzy..."
        className="max-w-sm mb-6"
        onChange={(e) => {
          setFilters([
            {
              field: "name",
              operator: "contains",
              value: e.target.value,
            },
          ]);
        }}
      />

      <div className="max-w-md mx-auto">
        {data?.data?.map((dancer: any, index: number) => {
          const age = calculateAge(dancer.birth_date);
          const danceStyles = dancer.dancer_dance_styles?.map((ds: any) => ({
            name: ds.dance_styles?.name,
            level: ds.skill_level
          })).filter((ds: any) => ds.name) || [];
          
          return (
            <Card key={dancer.id} className={index > 0 ? "mt-4" : ""}>
              <CardHeader>
                <div className="relative">
                  <img
                    src={dancer.profile_photo_url || "/placeholder-dancer.jpg"}
                    alt={dancer.name}
                    className="w-full h-96 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-dancer.jpg";
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <h3 className="text-2xl font-bold text-white">
                      {dancer.name}{age ? `, ${age}` : ""}
                    </h3>
                    <p className="text-white/90 flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4" />
                      {dancer.city || dancer.location_address || "Nieznane"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FlexBox variant="start" className="flex-wrap gap-2 mb-4">
                  {danceStyles.map((style: any, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      <Music className="w-3 h-3 mr-1" />
                      {style.name} ({style.level})
                    </Badge>
                  ))}
                </FlexBox>
                <p className="text-muted-foreground">
                  {dancer.bio?.substring(0, 150)}{dancer.bio?.length > 150 ? "..." : ""}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  {dancer.search_radius_km && (
                    <span>Zasięg: {dancer.search_radius_km} km</span>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <FlexBox className="w-full gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => show("dancers", dancer.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Profil
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleLike(dancer.id)}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Polub
                  </Button>
                </FlexBox>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <PaginationSwitch
        current={current}
        pageSize={pageSize}
        total={data?.total || 0}
        setCurrent={setCurrent}
        itemName="tancerzy"
      />
    </>
  );
};