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
  
  // Pobieramy wszystkie dopasowania i filtrujemy po stronie klienta
  const {
    tableQuery: { data: matchesData, isLoading, isError, refetch },
  } = useTable({
    resource: "matches",
    pagination: {
      mode: "off", // Wyłączamy paginację aby pobrać wszystkie
    },
  });

  const { mutate: createMatch } = useCreate();
  const { mutate: updateMatch } = useUpdate();
  
  const init = useLoading({ isLoading, isError });
  if (init) return init;

  const matches = matchesData?.data || [];
  
  // Zakładamy, że mamy current_user_id dostępny z kontekstu lub props
  // Jeśli nie, musisz go dostarczyć z Twojego systemu autentykacji
  const currentUserId = "CURRENT_USER_ID"; // TODO: Pobierz rzeczywiste ID zalogowanego użytkownika

  // Filtrujemy dopasowania po stronie klienta
  const categorizeMatches = () => {
    const pending: any[] = [];
    const mutual: any[] = [];
    const rejected: any[] = [];

    matches.forEach((match: any) => {
      const isUser1 = match.dancer1_id === currentUserId;
      const isUser2 = match.dancer2_id === currentUserId;
      
      if (!isUser1 && !isUser2) return; // Nie dotyczy tego użytkownika

      // Sprawdzamy status dla tego użytkownika
      if (match.is_match) {
        mutual.push({
          ...match,
          matched_dancer: isUser1 ? match.dancer2 : match.dancer1,
          current_user_id: currentUserId,
        });
      } else {
        const userStatus = isUser1 ? match.dancer1_status : match.dancer2_status;
        const otherStatus = isUser1 ? match.dancer2_status : match.dancer1_status;
        
        if (userStatus === 'rejected') {
          rejected.push({
            ...match,
            matched_dancer: isUser1 ? match.dancer2 : match.dancer1,
            current_user_id: currentUserId,
          });
        } else if (userStatus === 'pending' || otherStatus === 'pending') {
          pending.push({
            ...match,
            matched_dancer: isUser1 ? match.dancer2 : match.dancer1,
            current_user_id: currentUserId,
            initiator_id: otherStatus === 'liked' ? (isUser1 ? match.dancer2_id : match.dancer1_id) : currentUserId,
          });
        }
      }
    });

    return { pending, mutual, rejected };
  };

  const { pending: pendingMatches, mutual: mutualMatches, rejected: rejectedMatches } = categorizeMatches();

  const handleLike = (dancerId: string) => {
    // Najpierw sprawdzamy czy już istnieje dopasowanie
    const existingMatch = matches.find((m: any) => 
      (m.dancer1_id === currentUserId && m.dancer2_id === dancerId) ||
      (m.dancer2_id === currentUserId && m.dancer1_id === dancerId)
    );

    if (existingMatch) {
      // Aktualizujemy istniejące dopasowanie
      const isUser1 = existingMatch.dancer1_id === currentUserId;
      updateMatch(
        {
          resource: "matches",
          id: existingMatch.id,
          values: isUser1 
            ? { dancer1_status: 'liked' }
            : { dancer2_status: 'liked' },
        },
        {
          onSuccess: () => {
            refetch();
          },
        }
      );
    } else {
      // Tworzymy nowe dopasowanie
      createMatch(
        {
          resource: "matches",
          values: {
            dancer1_id: currentUserId,
            dancer2_id: dancerId,
            dancer1_status: 'liked',
            dancer2_status: 'pending',
          },
        },
        {
          onSuccess: () => {
            refetch();
          },
        }
      );
    }
  };

  const handleDislike = (matchId: string) => {
    const match = matches.find((m: any) => m.id === matchId);
    if (!match) return;

    const isUser1 = match.dancer1_id === currentUserId;
    updateMatch(
      {
        resource: "matches",
        id: matchId,
        values: isUser1 
          ? { dancer1_status: 'rejected' }
          : { dancer2_status: 'rejected' },
      },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  const handleAcceptMatch = (matchId: string) => {
    const match = matches.find((m: any) => m.id === matchId);
    if (!match) return;

    const isUser1 = match.dancer1_id === currentUserId;
    updateMatch(
      {
        resource: "matches",
        id: matchId,
        values: {
          [isUser1 ? 'dancer1_status' : 'dancer2_status']: 'liked',
          is_match: true,
          matched_at: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  const renderMatchCard = (match: any, showActions = true) => (
    <Card key={match.id}>
      <CardHeader>
        <div className="relative">
          <img
            src={match.matched_dancer?.profile_photo_url || "/placeholder-dancer.jpg"}
            alt={match.matched_dancer?.name}
            className="w-full h-80 object-cover rounded-lg"
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
              {match.matched_dancer?.birth_date && (
                <>, {new Date().getFullYear() - new Date(match.matched_dancer.birth_date).getFullYear()}</>
              )}
            </h3>
            <p className="text-white/90 flex items-center gap-2 text-sm">
              <MapPin className="w-3 h-3" />
              {match.matched_dancer?.location_address || "Lokalizacja nieznana"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <FlexBox variant="start" className="flex-wrap gap-2 mb-3">
          {match.matched_dancer?.dance_styles?.slice(0, 3).map((style: any) => (
            <Badge key={style.id || style} variant="secondary" className="text-xs">
              <Music className="w-3 h-3 mr-1" />
              {style.name || style}
            </Badge>
          ))}
        </FlexBox>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {match.matched_dancer?.bio || "Brak opisu"}
        </p>
        <div className="mt-3 text-xs text-muted-foreground">
          Dopasowano: {new Date(match.created_at).toLocaleDateString("pl-PL")}
        </div>
      </CardContent>
      {showActions && (
        <CardFooter>
          {!match.is_match && match.initiator_id !== match.current_user_id ? (
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
          ) : match.is_match ? (
            <Button className="w-full">
              <MessageCircle className="w-4 h-4 mr-2" />
              Napisz wiadomość
            </Button>
          ) : !match.is_match ? (
            <Badge variant="outline" className="w-full justify-center py-2">
              Oczekuje na odpowiedź
            </Badge>
          ) : null}
        </CardFooter>
      )}
    </Card>
  );

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