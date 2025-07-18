// src/pages/dancers/list.tsx
import { useTable, useNavigation } from "@refinedev/core";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Edit, Heart, MapPin, Music } from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { PaginationSwitch } from "@/components/navigation";
import { Lead } from "@/components/reader";
import { useLoading } from "@/utility";
import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { useState } from "react";

export const DancersList = () => {
  const [viewMode, setViewMode] = useState<"grid" | "cards">("cards");
  const {
    tableQuery: { data, isLoading, isError },
    current,
    setCurrent,
    pageSize,
    setFilters,
  } = useTable({
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
    },
  });
  
  const { edit, show } = useNavigation();
  const init = useLoading({ isLoading, isError });
  if (init) return init;

  const handleLike = async (dancerId: string) => {
    // Logika polubienia tancerza
    console.log("Liked dancer:", dancerId);
  };

  return (
    <>
      <FlexBox>
        <Lead
          title="Tancerze"
          description="Przeglądaj profile tancerzy i znajdź swojego partnera tanecznego"
        />
        <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cards">Karty</SelectItem>
            <SelectItem value="grid">Siatka</SelectItem>
          </SelectContent>
        </Select>
      </FlexBox>

      <FlexBox className="gap-4">
        <Input
          placeholder="Szukaj tancerzy..."
          className="max-w-sm"
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
        <Select
          onValueChange={(value) => {
            if (value === "all") {
              setFilters([]);
            } else {
              setFilters([
                {
                  field: "main_style",
                  operator: "eq",
                  value: value,
                },
              ]);
            }
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Wszystkie style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie style</SelectItem>
            <SelectItem value="salsa">Salsa</SelectItem>
            <SelectItem value="bachata">Bachata</SelectItem>
            <SelectItem value="tango">Tango</SelectItem>
            <SelectItem value="waltz">Walc</SelectItem>
          </SelectContent>
        </Select>
      </FlexBox>

      {viewMode === "cards" ? (
        <div className="max-w-md mx-auto">
          {data?.data?.map((dancer: any, index: number) => (
            <Card key={dancer.id} className={index > 0 ? "mt-4" : ""}>
              <CardHeader>
                <div className="relative">
                  <img
                    src={dancer.photo_url || "/placeholder-dancer.jpg"}
                    alt={dancer.name}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <h3 className="text-2xl font-bold text-white">{dancer.name}, {dancer.age}</h3>
                    <p className="text-white/90 flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4" />
                      {dancer.city}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FlexBox variant="start" className="flex-wrap gap-2 mb-4">
                  {dancer.dance_styles?.map((style: string) => (
                    <Badge key={style} variant="secondary">
                      <Music className="w-3 h-3 mr-1" />
                      {style}
                    </Badge>
                  ))}
                </FlexBox>
                <p className="text-muted-foreground">{dancer.bio?.substring(0, 150)}...</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Poziom: {dancer.experience_level}</span>
                  <span>•</span>
                  <span>Szuka: {dancer.looking_for}</span>
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
          ))}
        </div>
      ) : (
        <GridBox>
          {data?.data?.map((dancer: any) => (
            <Card key={dancer.id}>
              <CardHeader className="pb-3">
                <FlexBox>
                  <FlexBox variant="start" className="gap-3">
                    <Avatar>
                      <AvatarImage src={dancer.photo_url} />
                      <AvatarFallback>{dancer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{dancer.name}, {dancer.age}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {dancer.city}
                      </p>
                    </div>
                  </FlexBox>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(dancer.id)}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </FlexBox>
              </CardHeader>
              <CardContent>
                <FlexBox variant="start" className="flex-wrap gap-1 mb-3">
                  {dancer.dance_styles?.slice(0, 3).map((style: string) => (
                    <Badge key={style} variant="outline" className="text-xs">
                      {style}
                    </Badge>
                  ))}
                  {dancer.dance_styles?.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{dancer.dance_styles.length - 3}
                    </Badge>
                  )}
                </FlexBox>
                <p className="text-sm text-muted-foreground line-clamp-2">{dancer.bio}</p>
              </CardContent>
              <CardFooter className="pt-3">
                <FlexBox className="w-full">
                  <span className="text-xs text-muted-foreground">
                    {dancer.experience_level}
                  </span>
                  <FlexBox variant="end" className="gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => show("dancers", dancer.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => edit("dancers", dancer.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </FlexBox>
                </FlexBox>
              </CardFooter>
            </Card>
          ))}
        </GridBox>
      )}

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