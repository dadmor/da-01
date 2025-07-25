import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useGetIdentity } from "@refinedev/core";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Send,
  MoreVertical,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  MessageSquare,
} from "lucide-react";
import { SubPage } from "@/components/layout";
import { supabaseClient } from "@/utility/supabaseClient";
import { toast } from "sonner";
import { cn } from "@/utility";
import { format, isToday, isYesterday } from "date-fns";
import { pl } from "date-fns/locale";

// Interfejsy typów
interface User {
  id: string;
  name: string;
  profile_photo_url?: string;
  last_seen_at?: string;
  is_active?: boolean;
}

interface ConversationParticipant {
  user_id: string;
  unread_count: number;
  last_read_at?: string | null;
  user: User;
}

interface Conversation {
  id: string;
  last_message_at?: string;
  last_message_preview?: string;
  conversation_participants: ConversationParticipant[];
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: User;
  message_reads?: {
    user_id: string;
    read_at: string;
  }[];
}

interface Identity {
  id: string;
  name: string;
  profile_photo_url?: string;
}

// Komponent React
import React from "react";

// Komponenty memoizowane
const ConversationItem = React.memo(
  ({
    conversation,
    isSelected,
    onClick,
    identity,
    formatMessageTime,
  }: {
    conversation: Conversation;
    isSelected: boolean;
    onClick: () => void;
    identity: Identity;
    formatMessageTime: (date: string) => string;
  }) => {
    const otherParticipant = conversation.conversation_participants?.find(
      (p) => p.user_id !== identity?.id
    );
    const myParticipant = conversation.conversation_participants?.find(
      (p) => p.user_id === identity?.id
    );

    if (!otherParticipant?.user_id) return null;

    const hasUnread = (myParticipant?.unread_count || 0) > 0;

    return (
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 p-4 cursor-pointer transition-colors",
          "hover:bg-muted/50",
          isSelected && "bg-muted"
        )}
      >
        <div className="relative">
          <Avatar>
            <AvatarImage src={otherParticipant.user.profile_photo_url} />
            <AvatarFallback>
              {otherParticipant.user.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {hasUnread && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium truncate">{otherParticipant.user.name}</p>
            {conversation.last_message_at && (
              <span className="text-xs text-muted-foreground">
                {formatMessageTime(conversation.last_message_at)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground truncate">
              {conversation.last_message_preview || "Brak wiadomości"}
            </p>
            {hasUnread && myParticipant && (
              <Badge className="ml-2 h-5 px-1.5 min-w-[20px] justify-center">
                {myParticipant.unread_count}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }
);

const MessageComponent = React.memo(
  ({
    message,
    isMyMessage,
    identity,
  }: {
    message: Message;
    isMyMessage: boolean;
    identity: Identity;
  }) => {
    const isRead = message.message_reads?.some(
      (r) => r.user_id !== identity?.id
    );

    return (
      <div
        className={cn("flex", isMyMessage ? "justify-end" : "justify-start")}
      >
        <div
          className={cn(
            "max-w-[70%] rounded-lg px-4 py-2",
            isMyMessage ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>

          <div
            className={cn(
              "flex items-center gap-1 mt-1",
              isMyMessage ? "justify-end" : "justify-start"
            )}
          >
            <span
              className={cn(
                "text-xs",
                isMyMessage
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground"
              )}
            >
              {format(new Date(message.created_at), "HH:mm")}
            </span>

            {isMyMessage &&
              (isRead ? (
                <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
              ) : (
                <Check className="h-3 w-3 text-primary-foreground/70" />
              ))}
          </div>
        </div>
      </div>
    );
  }
);

export const ChatList = () => {
  const { data: identity } = useGetIdentity<Identity>();
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Memoizowane funkcje pomocnicze
  const formatMessageTime = useCallback((date: string) => {
    const messageDate = new Date(date);

    if (isToday(messageDate)) {
      return format(messageDate, "HH:mm");
    } else if (isYesterday(messageDate)) {
      return `Wczoraj ${format(messageDate, "HH:mm")}`;
    } else {
      return format(messageDate, "dd.MM.yyyy HH:mm", { locale: pl });
    }
  }, []);

  const formatLastSeen = useCallback((date?: string) => {
    if (!date) return "Dawno temu";

    const lastSeenDate = new Date(date);

    if (isToday(lastSeenDate)) {
      return `Ostatnio aktywny(a) dzisiaj o ${format(lastSeenDate, "HH:mm")}`;
    } else if (isYesterday(lastSeenDate)) {
      return `Ostatnio aktywny(a) wczoraj o ${format(lastSeenDate, "HH:mm")}`;
    } else {
      return `Ostatnio aktywny(a) ${format(lastSeenDate, "dd.MM.yyyy", {
        locale: pl,
      })}`;
    }
  }, []);

  // Pobieranie konwersacji
  const fetchConversations = useCallback(async () => {
    if (!identity?.id) return;

    setIsLoadingConversations(true);

    try {
      const { data, error } = await supabaseClient.rpc("get_my_conversations");

      if (error) throw error;

      const formattedConversations: Conversation[] =
        data?.map((conv: any) => ({
          id: conv.conversation_id,
          last_message_at: conv.last_message_time,
          last_message_preview: conv.last_message,
          conversation_participants: [
            {
              user_id: conv.other_user_id || identity.id,
              unread_count: conv.my_unread_count || 0,
              last_read_at: null,
              user: {
                id: conv.other_user_id,
                name: conv.other_user_name,
                profile_photo_url: conv.other_user_photo,
                last_seen_at: null,
                is_active: false,
              },
            },
          ],
        })) || [];

      setConversations(formattedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Błąd przy pobieraniu konwersacji");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [identity?.id]);

  // Aktualizuj pojedynczą konwersację bez pełnego przeładowania
  const updateSingleConversation = useCallback(
    (conversationId: string, updates: Partial<Conversation>) => {
      setConversations((prev) =>
        prev
          .map((conv) =>
            conv.id === conversationId ? { ...conv, ...updates } : conv
          )
          .sort(
            (a, b) =>
              new Date(b.last_message_at || 0).getTime() -
              new Date(a.last_message_at || 0).getTime()
          )
      );
    },
    []
  );

  // Pobierz konwersacje przy pierwszym załadowaniu
  useEffect(() => {
    if (identity?.id) {
      fetchConversations();
    }
  }, [identity?.id, fetchConversations]);

  // Real-time subskrypcja dla wiadomości w aktualnej konwersacji
  useEffect(() => {
    if (!selectedConversation || !identity?.id) return;

    // Subskrypcja do tabeli messages dla konkretnej konwersacji
    const messagesSubscription = supabaseClient
      .channel(`messages-${selectedConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        async (payload: any) => {
          console.log("Nowa wiadomość:", payload);

          // Jeśli to nie nasza wiadomość, dodaj ją
          if (payload.new.sender_id !== identity.id) {
            // Pobierz dane nadawcy
            const { data: senderData } = await supabaseClient
              .from("users")
              .select("name, profile_photo_url")
              .eq("id", payload.new.sender_id)
              .single();

            const newMessage: Message = {
              ...payload.new,
              sender: senderData,
              message_reads: [],
            };

            setMessages((prev) => [...prev, newMessage]);

            // Aktualizuj preview konwersacji
            updateSingleConversation(selectedConversation, {
              last_message_preview: payload.new.content,
              last_message_at: payload.new.created_at,
            });

            // Odtwórz dźwięk powiadomienia (opcjonalnie)
            // new Audio('/notification.mp3').play();
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(messagesSubscription);
    };
  }, [selectedConversation, identity?.id, updateSingleConversation]);

  // Real-time subskrypcja dla listy konwersacji (unread count, nowe konwersacje)
  useEffect(() => {
    if (!identity?.id) return;

    // Subskrypcja do zmian w conversation_participants (unread_count)
    const participantsSubscription = supabaseClient
      .channel("conversation-participants")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_participants",
          filter: `user_id=eq.${identity.id}`,
        },
        (payload: any) => {
          console.log("Zmiana w uczestnikach:", payload);

          // Aktualizuj unread_count dla konwersacji
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === payload.new.conversation_id) {
                const updatedParticipants = conv.conversation_participants.map(
                  (p) =>
                    p.user_id === identity.id
                      ? { ...p, unread_count: payload.new.unread_count }
                      : p
                );
                return {
                  ...conv,
                  conversation_participants: updatedParticipants,
                };
              }
              return conv;
            })
          );
        }
      )
      .subscribe();

    // Subskrypcja do nowych konwersacji
    const conversationsSubscription = supabaseClient
      .channel("conversations-list")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
        },
        () => {
          console.log("Nowa konwersacja");
          // Odśwież listę konwersacji
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(participantsSubscription);
      supabaseClient.removeChannel(conversationsSubscription);
    };
  }, [identity?.id, fetchConversations]);

  // Pobierz wiadomości dla wybranej konwersacji
  const fetchMessages = useCallback(
    async (conversationId: string) => {
      setIsLoadingMessages(true);
      try {
        const { data, error } = await supabaseClient
          .from("messages")
          .select(
            `
          *,
          sender:users!sender_id(
            name,
            profile_photo_url
          ),
          message_reads(
            user_id,
            read_at
          )
        `
          )
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);

        // Oznacz wiadomości jako przeczytane
        if (data && data.length > 0 && identity?.id) {
          markMessagesAsRead(conversationId);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Błąd przy pobieraniu wiadomości");
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [identity?.id]
  );

  // Oznacz wiadomości jako przeczytane
  const markMessagesAsRead = useCallback(
    async (conversationId: string) => {
      if (!identity?.id) return;

      try {
        // Najpierw zaktualizuj lokalnie
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === conversationId) {
              const updatedParticipants = conv.conversation_participants.map(
                (p) =>
                  p.user_id === identity.id ? { ...p, unread_count: 0 } : p
              );
              return {
                ...conv,
                conversation_participants: updatedParticipants,
              };
            }
            return conv;
          })
        );

        // Potem wyślij do bazy
        await supabaseClient.rpc("mark_conversation_read", {
          p_conversation_id: conversationId,
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    },
    [identity?.id]
  );

  // Wyślij wiadomość
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation || !identity?.id) return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: selectedConversation,
      sender_id: identity.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      sender: {
        id: identity.id,
        name: identity.name,
        profile_photo_url: identity.profile_photo_url,
      },
      message_reads: [],
    };

    // Optymistyczna aktualizacja - dodaj wiadomość natychmiast
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    // Aktualizuj preview w liście konwersacji
    updateSingleConversation(selectedConversation, {
      last_message_preview: messageContent,
      last_message_at: new Date().toISOString(),
    });

    try {
      const { data, error } = await supabaseClient
        .from("messages")
        .insert({
          conversation_id: selectedConversation,
          sender_id: identity.id,
          content: messageContent,
        })
        .select()
        .single();

      if (error) throw error;

      // Zastąp tymczasową wiadomość prawdziwą
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? { ...data, sender: optimisticMessage.sender }
            : msg
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Błąd przy wysyłaniu wiadomości");

      // Usuń optymistyczną wiadomość i przywróć tekst
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(messageContent);

      // Przywróć poprzedni stan konwersacji
      fetchConversations();
    }
  }, [
    newMessage,
    selectedConversation,
    identity,
    updateSingleConversation,
    fetchConversations,
  ]);

  // Przewiń do końca wiadomości
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [messages]);

  // Wybierz konwersację
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation, fetchMessages]);

  // Filtruj konwersacje - memoizowane
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const otherParticipant = conv.conversation_participants?.find(
        (p) => p.user_id !== identity?.id
      );
      return otherParticipant?.user?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery, identity?.id]);

  // Pobierz aktualnego rozmówcę - memoizowane
  const currentConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversation),
    [conversations, selectedConversation]
  );

  const currentParticipant = useMemo(
    () =>
      currentConversation?.conversation_participants?.find(
        (p) => p.user_id !== identity?.id
      ),
    [currentConversation, identity?.id]
  );

  return (
    <SubPage>
      <div className="flex h-[calc(100vh-10rem)] gap-4 overflow-hidden">
        {/* Lista konwersacji */}
        <Card className="w-96 flex flex-col">
          {/* Nagłówek */}
          <div className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Czaty</h2>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            {/* Wyszukiwarka */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Szukaj konwersacji..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Lista konwersacji */}
          <ScrollArea className="flex-1">
            {isLoadingConversations ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">Ładowanie konwersacji...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Brak konwersacji</p>
                <p className="text-xs mt-2">
                  Dopasuj się z kimś, aby rozpocząć czat
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversation === conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  identity={identity!}
                  formatMessageTime={formatMessageTime}
                />
              ))
            )}
          </ScrollArea>
        </Card>

        {/* Okno czatu */}
        {selectedConversation && currentParticipant ? (
          <Card className="flex-1 flex flex-col min-h-0">
            {/* Nagłówek czatu */}
            <div className="p-4 border-b flex items-center gap-3 flex-shrink-0">
              <Avatar>
                <AvatarImage src={currentParticipant.user.profile_photo_url} />
                <AvatarFallback>
                  {currentParticipant.user.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="font-medium">{currentParticipant.user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {currentParticipant.user.is_active
                    ? "Aktywny(a) teraz"
                    : formatLastSeen(currentParticipant.user.last_seen_at)}
                </p>
              </div>

              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            {/* Wiadomości */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              {isLoadingMessages ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Ładowanie wiadomości...
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Brak wiadomości</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Wyślij pierwszą wiadomość!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <MessageComponent
                      key={message.id}
                      message={message}
                      isMyMessage={message.sender_id === identity?.id}
                      identity={identity!}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Pole wprowadzania */}
            <div className="p-4 border-t flex-shrink-0">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-4 w-4" />
                </Button>

                <Input
                  placeholder="Napisz wiadomość..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1"
                />

                <Button variant="ghost" size="icon">
                  <Smile className="h-4 w-4" />
                </Button>

                <Button
                  onClick={sendMessage}
                  size="icon"
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Wybierz konwersację</h3>
              <p className="text-sm text-muted-foreground">
                Wybierz czat z listy, aby zobaczyć wiadomości
              </p>
            </div>
          </Card>
        )}
      </div>
    </SubPage>
  );
};
