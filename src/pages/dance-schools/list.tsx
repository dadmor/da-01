// src/pages/dance-schools/list.tsx
import { useTable, useNavigation } from "@refinedev/core";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Edit, MapPin, Users, Star, Plus } from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { PaginationSwith } from "@/components/navigation";
import { Lead } from "@/components/reader";
import { useLoading } from "@/utility";
import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";

export const DanceSchoolsList = () => {
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
  
  const { create, edit, show } = useNavigation();
  const init = useLoading({ isLoading, isError });
  if (init) return init;

  return (
    <>
      <FlexBox>
        <Lead
          title="Szkoły tańca"
          description="Znajdź najlepszą szkołę tańca w Twojej okolicy"
        />
        <Button onClick={() => create("dance_schools")}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj szkołę
        </Button>
      </FlexBox>

      <FlexBox className="gap-4">
        <Input
          placeholder="Szukaj szkół..."
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
                  field: "city",
                  operator: "eq",
                  value: value,
                },
              ]);
            }
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Wszystkie miasta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie miasta</SelectItem>
            <SelectItem value="Warszawa">Warszawa</SelectItem>
            <SelectItem value="Kraków">Kraków</SelectItem>
            <SelectItem value="Wrocław">Wrocław</SelectItem>
            <SelectItem value="Poznań">Poznań</SelectItem>
            <SelectItem value="Gdańsk">Gdańsk</SelectItem>
          </SelectContent>
        </Select>
      </FlexBox>

      <GridBox>
        {data?.data?.map((school: any) => (
          <Card key={school.id} className="overflow-hidden">
            {school.logo_url && (
              <div className="h-48 relative">
                <img
                  src={school.logo_url}
                  alt={school.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge className="bg-yellow-500 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    {school.rating || "4.5"}
                  </Badge>
                </div>
              </div>
            )}
            <CardHeader>
              <FlexBox>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{school.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {school.city}, {school.address}
                  </p>
                </div>
                {!school.logo_url && (
                  <Avatar>
                    <AvatarFallback>{school.name[0]}</AvatarFallback>
                  </Avatar>
                )}
              </FlexBox>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {school.description}
              </p>
              <FlexBox variant="start" className="flex-wrap gap-1 mb-3">
                {school.dance_styles?.slice(0, 3).map((style: string) => (
                  <Badge key={style} variant="outline" className="text-xs">
                    {style}
                  </Badge>
                ))}
                {school.dance_styles?.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{school.dance_styles.length - 3}
                  </Badge>
                )}
              </FlexBox>
              <FlexBox className="text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {school.students_count || 0} uczniów
                </span>
                <span>{school.price_range || "$$"}</span>
              </FlexBox>
            </CardContent>
            <CardFooter>
              <FlexBox className="w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => show("dance_schools", school.id)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Zobacz
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => edit("dance_schools", school.id)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </FlexBox>
            </CardFooter>
          </Card>
        ))}
      </GridBox>

      <PaginationSwith
        current={current}
        pageSize={pageSize}
        total={data?.total || 0}
        setCurrent={setCurrent}
        itemName="szkół"
      />
    </>
  );
};