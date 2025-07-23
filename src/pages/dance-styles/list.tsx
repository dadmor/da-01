// src/pages/dance-styles/list.tsx
import { useTable, useNavigation } from "@refinedev/core";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Music, Plus, Users } from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { PaginationSwith } from "@/components/navigation";
import { Lead } from "@/components/reader";
import { useLoading } from "@/utility";
import { Badge, Button, Input } from "@/components/ui";
import { SubPage } from "@/components/layout";

export const DanceStylesList = () => {
  const { create } = useNavigation();
  
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
          field: "name",
          order: "asc",
        },
      ],
    },
  });
  
  const init = useLoading({ isLoading, isError });
  if (init) return init;

  return (
    <SubPage>
      <FlexBox>
        <Lead
          title="Style tańca"
          description="Katalog dostępnych stylów tańca"
        />
        <Button onClick={() => create("dance_styles")}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj styl
        </Button>
      </FlexBox>

      <FlexBox>
        <Input
          placeholder="Szukaj stylów..."
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
      </FlexBox>

      <GridBox>
        {data?.data?.map((style: any) => (
          <Card key={style.id}>
            <CardHeader>
              <FlexBox>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  {style.name}
                </CardTitle>
                <Badge variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  {style.dancers_count || 0}
                </Badge>
              </FlexBox>
            </CardHeader>
            {style.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {style.description}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </GridBox>

      <PaginationSwith
        current={current}
        pageSize={pageSize}
        total={data?.total || 0}
        setCurrent={setCurrent}
        itemName="stylów"
      />
    </SubPage>
  );
};