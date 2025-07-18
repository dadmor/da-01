// src/pages/chat-conversations/list.tsx
import { useTable, useNavigation } from "@refinedev/core";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Search, Circle } from "lucide-react";
import { FlexBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { useLoading } from "@/utility";
import { Badge, Input } from "@/components/ui";
import { useEffect } from "react";
import { supabaseClient } from "@/utility";

export const ChatConversationsList = () => {
  const {
    tableQuery: { data, isLoading, isError, refetch },
    setFilters,
  } = useTable({
    sorters: {
      initial: [
        {
          field: "last_message_at",
          order: "desc",
        },
      ],
    },
  });
  
  const { show } = useNavigation();
  const init = useLoading({ isLoading, isError });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabaseClient
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations',
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [refetch]);

  if (init) return init;

  const formatLastMessage = (message: string, maxLength: number = 50) => {
    if (!message) return "Brak wiadomości";
    return message.length > maxLength 
      ? `${message.substring(0, maxLength)}...` 
      : message;
  };

  const formatTime = (date: string) => {
    if (!date) return "";
    
    const messageDate = new Date(date);
    const now = new Date();
    const diff = now.getTime() - messageDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 7) {
      return messageDate.toLocaleDateString("pl-PL");
    } else if (days > 0) {
      return `${days} dni temu`;
    } else if (hours > 0) {
      return `${hours} godz. temu`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes > 0 ? `${minutes} min. temu` : "Teraz";
    }
  };

  const conversations = data?.data || [];

  return (
    <>
      <FlexBox>
        <Lead
          title="Wiadomości"
          description="Twoje rozmowy z innymi tancerzami"
        />
      </FlexBox>

      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Szukaj rozmów..."
              className="pl-10"
              onChange={(e) => {
                setFilters([
                  {
                    field: "participant_name",
                    operator: "contains",
                    value: e.target.value,
                  },
                ]);
              }}
            />
          </div>
        </div>

        {conversations.length > 0 ? (
          <div className="space-y-2">
            {conversations.map((conversation: any) => (
              <Card 
                key={conversation.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => show("chat_conversations", conversation.id)}
              >
                <CardContent className="p-4">
                  <FlexBox>
                    <FlexBox variant="start" className="flex-1 gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conversation.other_participant?.photo_url} />
                          <AvatarFallback>
                            {conversation.other_participant?.name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.other_participant?.is_online && (
                          <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-green-500 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <FlexBox className="mb-1">
                          <h3 className="font-semibold truncate">
                            {conversation.other_participant?.name || "Nieznany użytkownik"}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.last_message_at)}
                          </span>
                        </FlexBox>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.last_message_sender_id === conversation.current_user_id && (
                            <span className="font-medium">Ty: </span>
                          )}
                          {formatLastMessage(conversation.last_message)}
                        </p>
                      </div>
                    </FlexBox>
                    <FlexBox variant="end" className="flex-col items-end gap-2">
                      {conversation.unread_count > 0 && (
                        <Badge className="bg-blue-500 text-white">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </FlexBox>
                  </FlexBox>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nie masz jeszcze żadnych rozmów
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Znajdź dopasowania i rozpocznij czat!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};