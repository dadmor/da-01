// src/pages/matches/list.tsx
import { useTable, useCreate, useUpdate } from "@refinedev/core";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, X, MessageCircle, MapPin, Music, Check } from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { useLoading } from "@/utility";
import { Badge, Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { useState } from "react";

export const MatchesList = () => {
  const [activeTab, setActiveTab] = useState("pending");
  
  const {
    tableQuery: { data: pendingData, isLoading: pendingLoading, isError: pendingError, refetch: refetchPending },
  } = useTable({
    resource: "matches",
    filters: {
      permanent: [
        {
          field: "status",
          operator: "eq",
          value: "pending",
        },
      ],
    },
    queryOptions: {
      enabled: activeTab === "pending",
    },
  });

  const {
    tableQuery: { data: mutualData, isLoading: mutualLoading, isError: mutualError },
  } = useTable({
    resource: "matches",
    filters: {
      permanent: [
        {
          field: "status",
          operator: "eq",
          value: "mutual",
        },
      ],
    },
    queryOptions: {
      enabled: activeTab === "mutual",
    },
  });

  const {
    tableQuery: { data: rejectedData, isLoading: rejectedLoading, isError: rejectedError },
  } = useTable({
    resource: "matches",
    filters: {
      permanent: [
        {
          field: "status",
          operator: "eq",
          value: "rejected",
        },
      ],
    },
    queryOptions: {
      enabled: activeTab === "rejected",
    },
  });
  
  const { mutate: createMatch } = useCreate();
  const { mutate: updateMatch } = useUpdate();
  
  const isLoading = pendingLoading || mutualLoading || rejectedLoading;
  const isError = pendingError || mutualError || rejectedError;
  
  const init = useLoading({ isLoading, isError });
  if (init) return init;

  const handleLike = (dancerId: string) => {
    createMatch(
      {
        resource: "matches",
        values: {
          matched_dancer_id: dancerId,
          status: "pending",
          action: "like",
        },
      },
      {
        onSuccess: () => {
          refetchPending();
        },
      }
    );
  };

  const handleDislike = (matchId: string) => {
    updateMatch(
      {
        resource: "matches",
        id: matchId,
        values: {
          status: "rejected",
          action: "dislike",
        },
      },
      {
        onSuccess: () => {
          refetchPending();
        },
      }
    );
  };

  const handleAcceptMatch = (matchId: string) => {
    updateMatch(
      {
        resource: "matches",
        id: matchId,
        values: {
          status: "mutual",
        },
      },
      {
        onSuccess: () => {
          refetchPending();
        },
      }
    );
  };

  const renderMatchCard = (match: any, showActions: boolean = true) => (
    <Card key={match.id}>
      <CardHeader>
        <div className="relative">
          <img
            src={match.matched_dancer?.photo_url || "/placeholder-dancer.jpg"}
            alt={match.matched_dancer?.name}
            className="w-full h-80 object-cover rounded-lg"
          />
          {match.status === "mutual" && (
            <Badge className="absolute top-2 right-2 bg-green-500">
              <Check className="w-3 h-3 mr-1" />
              Dopasowanie!
            </Badge>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <h3 className="text-xl font-bold text-white">
              {match.matched_dancer?.name}, {match.matched_dancer?.age}
            </h3>
            <p className="text-white/90 flex items-center gap-2 text-sm">
              <MapPin className="w-3 h-3" />
              {match.matched_dancer?.city}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <FlexBox variant="start" className="flex-wrap gap-2 mb-3">
          {match.matched_dancer?.dance_styles?.slice(0, 3).map((style: string) => (
            <Badge key={style} variant="secondary" className="text-xs">
              <Music className="w-3 h-3 mr-1" />
              {style}
            </Badge>
          ))}
        </FlexBox>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {match.matched_dancer?.bio}
        </p>
        <div className="mt-3 text-xs text-muted-foreground">
          Dopasowano: {new Date(match.created_at).toLocaleDateString("pl-PL")}
        </div>
      </CardContent>
      {showActions && (
        <CardFooter>
          {match.status === "pending" && match.initiator_id !== match.current_user_id ? (
            <FlexBox className="w-full gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleDislike(match.id)}
              >
                <X className="w-4 h-4 mr-2" />
                Odrzuć
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleAcceptMatch(match.id)}
              >
                <Heart className="w-4 h-4 mr-2" />
                Akceptuj
              </Button>
            </FlexBox>
          ) : match.status === "mutual" ? (
            <Button className="w-full">
              <MessageCircle className="w-4 h-4 mr-2" />
              Napisz wiadomość
            </Button>
          ) : match.status === "pending" ? (
            <Badge variant="outline" className="w-full justify-center py-2">
              Oczekuje na odpowiedź
            </Badge>
          ) : null}
        </CardFooter>
      )}
    </Card>
  );

  const pendingMatches = pendingData?.data || [];
  const mutualMatches = mutualData?.data || [];
  const rejectedMatches = rejectedData?.data || [];

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
          <TabsTrigger value="pending">
            Oczekujące ({pendingMatches.length})
          </TabsTrigger>
          <TabsTrigger value="mutual">
            Dopasowania ({mutualMatches.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Odrzucone ({rejectedMatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingMatches.length > 0 ? (
            <div className="max-w-md mx-auto space-y-4">
              {pendingMatches.map((match: any) => renderMatchCard(match))}
            </div>
          ) : (
            <Card className="max-w-md mx-auto">
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  Brak oczekujących dopasowań
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

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

        <TabsContent value="rejected">
          {rejectedMatches.length > 0 ? (
            <GridBox>
              {rejectedMatches.map((match: any) => renderMatchCard(match, false))}
            </GridBox>
          ) : (
            <Card className="max-w-md mx-auto">
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  Brak odrzuconych dopasowań
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
};