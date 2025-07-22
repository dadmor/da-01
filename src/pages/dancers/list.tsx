// ------ src/pages/dancers/list.tsx ------
import { useTable, useNavigation } from "@refinedev/core";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Eye, MapPin, Calendar, Award } from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { PaginationSwith } from "@/components/navigation";
import { Lead } from "@/components/reader";
import { useLoading } from "@/utility";
import { Badge, Button, Input } from "@/components/ui";
import { SubPage } from "@/components/layout";

export const DancersList = () => {
  const {
    tableQuery: { data, isLoading, isError },
    current,
    setCurrent,
    pageSize,
    setFilters,
  } = useTable({
    resource: "v_public_dancers",
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

  return (
    <SubPage>
      <FlexBox>
        <Lead
          title="Tancerze"
          description="Przeglądaj profile tancerzy w Twojej okolicy"
        />
      </FlexBox>

      <FlexBox>
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
      </FlexBox>

      <GridBox>
        {data?.data?.map((dancer: any) => (
          <Card key={dancer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <FlexBox>
                <div className="flex-1">
                  <Lead
                    title={
                      <FlexBox variant="start" className="gap-2">
                        {dancer.name}
                        {dancer.is_verified && (
                          <Award className="w-4 h-4 text-blue-500" />
                        )}
                      </FlexBox>
                    }
                    description={
                      <FlexBox variant="start" className="gap-4 text-sm">
                        {dancer.age && <span>{dancer.age} lat</span>}
                        {dancer.height && <span>{dancer.height} cm</span>}
                        {dancer.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {dancer.city}
                          </span>
                        )}
                      </FlexBox>
                    }
                    variant="card"
                  />
                </div>
                {dancer.is_trainer && (
                  <Badge variant="secondary">Trener</Badge>
                )}
              </FlexBox>
            </CardHeader>

            <CardContent>
              {dancer.bio && (
                <p className="text-sm text-muted-foreground mb-3">
                  {dancer.bio.substring(0, 100)}...
                </p>
              )}

              {dancer.dance_styles?.length > 0 && (
                <FlexBox variant="start" className="flex-wrap gap-1">
                  {dancer.dance_styles
                    .slice(0, 3)
                    .map((style: any, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {style.style_name} • {style.skill_level}
                      </Badge>
                    ))}
                  {dancer.dance_styles.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{dancer.dance_styles.length - 3} więcej
                    </Badge>
                  )}
                </FlexBox>
              )}
            </CardContent>

            <CardFooter>
              <FlexBox>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(dancer.created_at).toLocaleDateString("pl-PL")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => show("v_public_dancers", dancer.id)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Zobacz profil
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
        itemName="tancerzy"
      />
    </SubPage>
  );
};