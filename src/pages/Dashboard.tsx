// src/pages/Dashboard.tsx
import { useList, useNavigation } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Calendar,
  Heart,
  MessageCircle,
  TrendingUp,
  MapPin,
  Music,
  GraduationCap,
} from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Badge, Button } from "@/components/ui";
import { useLoading } from "@/utility";

export default function Dashboard() {
  const { show, list } = useNavigation();

  // Fetch dashboard data
  const { data: matchesData, isLoading: matchesLoading } = useList({
    resource: "matches",
    filters: [{ field: "status", operator: "eq", value: "mutual" }],
    pagination: { pageSize: 5 },
  });

  const { data: upcomingEventsData, isLoading: eventsLoading } = useList({
    resource: "outdoor_events",
    filters: [
      {
        field: "event_date",
        operator: "gte",
        value: new Date().toISOString(),
      },
    ],
    pagination: { pageSize: 3 },
    sorters: [{ field: "event_date", order: "asc" }],
  });

  const { data: conversationsData, isLoading: conversationsLoading } = useList({
    resource: "chat_conversations",
    pagination: { pageSize: 5 },
    sorters: [{ field: "last_message_at", order: "desc" }],
  });

  const { data: nearbyDancersData, isLoading: dancersLoading } = useList({
    resource: "dancers",
    filters: [{ field: "city", operator: "eq", value: "Warszawa" }], // Should be user's city
    pagination: { pageSize: 6 },
  });

  const isLoading = matchesLoading || eventsLoading || conversationsLoading || dancersLoading;
  const init = useLoading({ isLoading, isError: false });
  if (init) return init;

  const matches = matchesData?.data || [];
  const upcomingEvents = upcomingEventsData?.data || [];
  const conversations = conversationsData?.data || [];
  const nearbyDancers = nearbyDancersData?.data || [];

  const stats = [
    {
      title: "Dopasowania",
      value: matches.length,
      icon: Heart,
      color: "text-pink-500",
      bg: "bg-pink-50",
    },
    {
      title: "Wiadomości",
      value: conversations.filter((c: any) => c.unread_count > 0).length,
      icon: MessageCircle,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      title: "Nadchodzące wydarzenia",
      value: upcomingEvents.length,
      icon: Calendar,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      title: "Tancerze w okolicy",
      value: nearbyDancers.length,
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
  ];

  return (
    <>
      <Lead
        title="Witaj w Dance App!"
        description="Twój panel kontrolny do zarządzania profilem tanecznym"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <FlexBox>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.bg} p-3 rounded-lg`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </FlexBox>
            </CardContent>
          </Card>
        ))}
      </div>

      <GridBox>
        {/* Recent Matches */}
        <Card>
          <CardHeader>
            <FlexBox>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Ostatnie dopasowania
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => list("matches")}
              >
                Zobacz wszystkie
              </Button>
            </FlexBox>
          </CardHeader>
          <CardContent>
            {matches.length > 0 ? (
              <div className="space-y-3">
                {matches.map((match: any) => (
                  <div
                    key={match.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => show("dancers", match.matched_dancer_id)}
                  >
                    <img
                      src={match.matched_dancer?.photo_url || "/placeholder-dancer.jpg"}
                      alt={match.matched_dancer?.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{match.matched_dancer?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {match.matched_dancer?.city}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Music className="w-3 h-3 mr-1" />
                      {match.matched_dancer?.dance_styles?.[0]}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Brak dopasowań
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <FlexBox>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Nadchodzące wydarzenia
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => list("outdoor_events")}
              >
                Zobacz wszystkie
              </Button>
            </FlexBox>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event: any) => (
                  <div
                    key={event.id}
                    className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => show("outdoor_events", event.id)}
                  >
                    <FlexBox className="mb-2">
                      <h4 className="font-medium">{event.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {new Date(event.event_date).toLocaleDateString("pl-PL")}
                      </Badge>
                    </FlexBox>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.location}, {event.city}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Brak nadchodzących wydarzeń
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <FlexBox>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Ostatnie rozmowy
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => list("chat_conversations")}
              >
                Zobacz wszystkie
              </Button>
            </FlexBox>
          </CardHeader>
          <CardContent>
            {conversations.length > 0 ? (
              <div className="space-y-3">
                {conversations.map((conv: any) => (
                  <div
                    key={conv.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => show("chat_conversations", conv.id)}
                  >
                    <img
                      src={conv.other_participant?.photo_url || "/placeholder-dancer.jpg"}
                      alt={conv.other_participant?.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {conv.other_participant?.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.last_message}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <Badge className="bg-blue-500 text-white">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Brak rozmów
              </p>
            )}
          </CardContent>
        </Card>
      </GridBox>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Szybkie akcje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto flex-col py-4"
              onClick={() => list("dancers")}
            >
              <Users className="w-6 h-6 mb-2" />
              <span>Przeglądaj tancerzy</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col py-4"
              onClick={() => list("dance_schools")}
            >
              <GraduationCap className="w-6 h-6 mb-2" />
              <span>Znajdź szkołę</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col py-4"
              onClick={() => list("outdoor_events")}
            >
              <MapPin className="w-6 h-6 mb-2" />
              <span>Wydarzenia plenerowe</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col py-4"
              onClick={() => list("school_events")}
            >
              <Calendar className="w-6 h-6 mb-2" />
              <span>Warsztaty i kursy</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}