// src/pages/matches/list.tsx
import { useList, useGetIdentity } from "@refinedev/core";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { MessageCircle, MapPin, Music, Check, Clock } from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { useLoading } from "@/utility";
import { Badge, Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { useState, useEffect } from "react";
import { useNavigation } from "@refinedev/core";

export const MatchesList = () => {
  const [activeTab, setActiveTab] = useState("mutual");
  const [currentDancerId, setCurrentDancerId] = useState<string | null>(null);
  const { show } = useNavigation();
  const { data: identity } = useGetIdentity();
  
  // Pobierz ID obecnego tancerza
  const { data: dancerData } = useList({
    resource: "dancers",
    filters: [
      {
        field: "user_id",
        operator: "eq",
        value: identity?.id || "",
      },
    ],
    queryOptions: {
      enabled: !!identity?.id,
    },
  });

  useEffect(() => {
    if (dancerData?.data && dancerData.data.length > 0) {
      setCurrentDancerId(dancerData.data[0].id);
    }
  }, [dancerData]);

  // Pobierz polubienia które wysłałem
  const { data: myLikes, isLoading: isLoadingMyLikes } = useList({
    resource: "likes",
    filters: currentDancerId ? [
      {
        field: "from_dancer_id",
        operator: "eq",
        value: currentDancerId,
      },
    ] : [],
    meta: {
      select: '*, to_dancer:dancers!to_dancer_id(*)'
    },
    pagination: {
      mode: "off",
    },
    queryOptions: {
      enabled: !!currentDancerId,
    },
  });

  // Pobierz polubienia które otrzymałem
  const { data: receivedLikes, isLoading: isLoadingReceived } = useList({
    resource: "likes",
    filters: currentDancerId ? [
      {
        field: "to_dancer_id",
        operator: "eq",
        value: currentDancerId,
      },
    ] : [],
    meta: {
      select: '*, from_dancer:dancers!from_dancer_id(*)'
    },
    pagination: {
      mode: "off",
    },
    queryOptions: {
      enabled: !!currentDancerId,
    },
  });

  const isLoading = isLoadingMyLikes || isLoadingReceived;
  const init = useLoading({ isLoading, isError: false });
  if (init) return init;

  // Kategoryzuj dopasowania
  const categorizeMatches = () => {
    const myLikesData = myLikes?.data || [];
    const receivedLikesData = receivedLikes?.data || [];
    
    const mutual: any[] = [];
    const pending: any[] = [];
    const waiting: any[] = [];

    // Znajdź dopasowania (wzajemne polubienia)
    myLikesData.forEach((myLike: any) => {
      const mutualLike = receivedLikesData.find(
        (received: any) => received.from_dancer_id === myLike.to_dancer_id
      );
      
      if (mutualLike) {
        mutual.push({
          id: `${myLike.id}-${mutualLike.id}`,
          matched_dancer: myLike.to_dancer,
          matched_at: mutualLike.created_at > myLike.created_at ? mutualLike.created_at : myLike.created_at,
          is_match: true,
        });
      } else {
        // Czekam na odpowiedź
        waiting.push({
          id: myLike.id,
          matched_dancer: myLike.to_dancer,
          created_at: myLike.created_at,
        });
      }
    });

    // Znajdź oczekujące polubienia (ktoś mnie polubił, ale ja jeszcze nie)
    receivedLikesData.forEach((receivedLike: any) => {
      const iLikedBack = myLikesData.find(
        (myLike: any) => myLike.to_dancer_id === receivedLike.from_dancer_id
      );
      
      if (!iLikedBack) {
        pending.push({
          id: receivedLike.id,
          matched_dancer: receivedLike.from_dancer,
          created_at: receivedLike.created_at,
        });
      }
    });

    return { mutual, pending, waiting };
  };

  const { mutual: mutualMatches, pending: pendingMatches, waiting: waitingMatches } = categorizeMatches();

  const renderMatchCard = (match: any, showActions = true) => {
    const age = match.matched_dancer?.birth_date ? 
      Math.floor((new Date().getTime() - new Date(match.matched_dancer.birth_date).getTime()) / 31557600000) : 
      null;

    return (
      <Card key={match.id}>
        <CardHeader>
          <div className="relative">
            <img
              src={match.matched_dancer?.profile_photo_url || "/placeholder-dancer.jpg"}
              alt={match.matched_dancer?.name}
              className="w-full h-80 object-cover rounded-lg cursor-pointer"
              onClick={() => show("dancers", match.matched_dancer?.id)}
            />
            {match.is_match && (
              <Badge className="absolute top-2 right-2 bg-green-500">
                <Check className="w-3 h-3 mr-1" />
                Dopasowanie!
              </Badge>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <h3 className="text-xl font-bold text-white">
                {match.matched_dancer?.name}
                {age && <>, {age}</>}
              </h3>
              <p className="text-white/90 flex items-center gap-2 text-sm">
                <MapPin className="w-3 h-3" />
                {match.matched_dancer?.city || "Nieznane"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {match.matched_dancer?.bio || "Brak opisu"}
          </p>
          <div className="mt-3 text-xs text-muted-foreground">
            {match.is_match ? 'Dopasowano' : 'Polubiono'}: {new Date(match.created_at || match.matched_at).toLocaleDateString("pl-PL")}
          </div>
        </CardContent>
        {showActions && (
          <CardFooter>
            {match.is_match ? (
              <Button className="w-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                Napisz wiadomość
              </Button>
            ) : activeTab === "waiting" ? (
              <Badge variant="outline" className="w-full justify-center py-2">
                <Clock className="w-3 h-3 mr-1" />
                Oczekuje na odpowiedź
              </Badge>
            ) : null}
          </CardFooter>
        )}
      </Card>
    );
  };

  return (
    <>
      <FlexBox>
        <Lead
          title="Dopasowania"
          description="Zarządzaj swoimi dopasowaniami tanecznymi"
        />
      </FlexBox>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mutual">
            Dopasowania ({mutualMatches.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Polubili Cię ({pendingMatches.length})
          </TabsTrigger>
          <TabsTrigger value="waiting">
            Czekające ({waitingMatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mutual">
          {mutualMatches.length > 0 ? (
            <GridBox>
              {mutualMatches.map((match: any) => renderMatchCard(match))}
            </GridBox>
          ) : (
            <Card className="max-w-md mx-auto">
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  Jeszcze nie masz żadnych dopasowań
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Kontynuuj przeglądanie profili!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {pendingMatches.length > 0 ? (
            <div className="max-w-md mx-auto space-y-4">
              {pendingMatches.map((match: any) => (
                <Card key={match.id}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <img
                        src={match.matched_dancer?.profile_photo_url || "/placeholder-dancer.jpg"}
                        alt={match.matched_dancer?.name}
                        className="w-24 h-24 rounded-full mx-auto mb-4 object-cover cursor-pointer"
                        onClick={() => show("dancers", match.matched_dancer?.id)}
                      />
                      <h3 className="font-semibold text-lg">{match.matched_dancer?.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        polubił(a) Cię {new Date(match.created_at).toLocaleDateString("pl-PL")}
                      </p>
                      <Button 
                        className="w-full"
                        onClick={() => show("dancers", match.matched_dancer?.id)}
                      >
                        Zobacz profil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="max-w-md mx-auto">
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  Nikt jeszcze Cię nie polubił
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="waiting">
          {waitingMatches.length > 0 ? (
            <GridBox>
              {waitingMatches.map((match: any) => renderMatchCard(match))}
            </GridBox>
          ) : (
            <Card className="max-w-md mx-auto">
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  Nie czekasz na żadne odpowiedzi
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
};