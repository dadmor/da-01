import { useState, useEffect, useRef } from "react";
import { useTable, useGetIdentity, useSubscription } from "@refinedev/core";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Send,
  MoreVertical,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Clock,
  MessageSquare,
} from "lucide-react";
import { SubPage } from "@/components/layout";
import { supabaseClient } from "@/utility/supabaseClient";
import { toast } from "sonner";
import { cn } from "@/utility";
import { format, isToday, isYesterday } from "date-fns";
import { pl } from "date-fns/locale";

interface Participant {
  user_id: string;
  user: {
    id: string;
    name: string;
    profile_photo_url?: string;
    last_seen_at?: string;
    is_active: boolean;
  };
  unread_count: number;
  last_read_at?: string;
}

interface Conversation {
  id: string;
  created_at: string;
  last_message_at?: string;
  last_message_preview?: string;
  participants: Participant[];
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  sender?: {
    name: string;
    profile_photo_url?: string;
  };
  reads?: {
    user_id: string;
    read_at: string;
  }[];
}

export const ChatList = () => {
  const { data: identity } = useGetIdentity<any>();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Pobierz konwersacje
  const {
    tableQuery: { data: conversationsData, isLoading, refetch: refetchConversations },
  } = useTable({
    resource: "conversations",
    meta: {
      select: `
        *,
        conversation_participants!inner(
          user_id,
          unread_count,
          last_read_at,
          user:users(
            id,
            name,
            profile_photo_url,
            last_seen_at,
            is_active
          )
        )
      `,
    },
    sorters: {
      initial: [
        {
          field: "last_message_at",
          order: "desc",
        },
      ],
    },
  });

  // Subskrybuj do nowych wiadomości
  useSubscription({
    channel: `messages:${selectedConversation}`,
    onLiveEvent: () => {
      if (selectedConversation) {
        fetchMessages(selectedConversation);
        refetchConversations();
      }
    },
    enabled: !!selectedConversation,
  });

  // Pobierz wiadomości dla wybranej konwersacji
  const fetchMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabaseClient
        .from("messages")
        .select(`
          *,
          sender:users!sender_id(
            name,
            profile_photo_url
          ),
          message_reads(
            user_id,
            read_at
          )
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Oznacz wiadomości jako przeczytane
      if (data && data.length > 0) {
        markMessagesAsRead(conversationId);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Błąd przy pobieraniu wiadomości");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Oznacz wiadomości jako przeczytane
  const markMessagesAsRead = async (conversationId: string) => {
    if (!identity?.id) return;

    try {
      // Pobierz nieprzeczytane wiadomości
      const { data: unreadMessages } = await supabaseClient
        .from("messages")
        .select("id")
        .eq("conversation_id", conversationId)
        .neq("sender_id", identity.id)
        .not("id", "in", `(
          SELECT message_id FROM message_reads WHERE user_id = '${identity.id}'
        )`);

      if (unreadMessages && unreadMessages.length > 0) {
        // Dodaj wpisy do message_reads
        await supabaseClient
          .from("message_reads")
          .insert(
            unreadMessages.map(msg => ({
              message_id: msg.id,
              user_id: identity.id,
            }))
          );
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Wyślij wiadomość
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !identity?.id) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      const { error } = await supabaseClient
        .from("messages")
        .insert({
          conversation_id: selectedConversation,
          sender_id: identity.id,
          content: messageContent,
        });

      if (error) throw error;

      // Odśwież listę wiadomości i konwersacji
      fetchMessages(selectedConversation);
      refetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Błąd przy wysyłaniu wiadomości");
      setNewMessage(messageContent); // Przywróć wiadomość
    }
  };

  // Przewiń do końca wiadomości
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Wybierz konwersację
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  // Formatuj czas
  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    
    if (isToday(messageDate)) {
      return format(messageDate, "HH:mm");
    } else if (isYesterday(messageDate)) {
      return `Wczoraj ${format(messageDate, "HH:mm")}`;
    } else {
      return format(messageDate, "dd.MM.yyyy HH:mm", { locale: pl });
    }
  };

  // Formatuj ostatnią aktywność
  const formatLastSeen = (date?: string) => {
    if (!date) return "Dawno temu";
    
    const lastSeenDate = new Date(date);
    
    if (isToday(lastSeenDate)) {
      return `Ostatnio aktywny(a) dzisiaj o ${format(lastSeenDate, "HH:mm")}`;
    } else if (isYesterday(lastSeenDate)) {
      return `Ostatnio aktywny(a) wczoraj o ${format(lastSeenDate, "HH:mm")}`;
    } else {
      return `Ostatnio aktywny(a) ${format(lastSeenDate, "dd.MM.yyyy", { locale: pl })}`;
    }
  };

  const conversations = (conversationsData?.data as any[]) || [];
  
  // Filtruj konwersacje
  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = conv.conversation_participants?.find(
      (p: Participant) => p.user_id !== identity?.id
    );
    return otherParticipant?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Pobierz aktualnego rozmówcę
  const currentConversation = conversations.find(c => c.id === selectedConversation);
  const currentParticipant = currentConversation?.conversation_participants?.find(
    (p: Participant) => p.user_id !== identity?.id
  );

  return (
    <SubPage>
      <div className="flex h-full gap-4">
        {/* Lista konwersacji - prawa strona jak w WhatsApp Web */}
        <Card className="w-96 flex flex-col h-full">
          {/* Nagłówek */}
          <div className="p-4 border-b">
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
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Brak konwersacji</p>
                <p className="text-xs mt-2">Dopasuj się z kimś, aby rozpocząć czat</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const otherParticipant = conversation.conversation_participants?.find(
                  (p: Participant) => p.user_id !== identity?.id
                );
                const myParticipant = conversation.conversation_participants?.find(
                  (p: Participant) => p.user_id === identity?.id
                );
                
                if (!otherParticipant?.user) return null;

                const isSelected = selectedConversation === conversation.id;
                const hasUnread = myParticipant?.unread_count > 0;

                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={cn(
                      "flex items-center gap-3 p-4 cursor-pointer transition-colors",
                      "hover:bg-muted/50",
                      isSelected && "bg-muted"
                    )}
                  >
                    <Avatar>
                      <AvatarImage src={otherParticipant.user.profile_photo_url} />
                      <AvatarFallback>
                        {otherParticipant.user.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium truncate">
                          {otherParticipant.user.name}
                        </p>
                        {conversation.last_message_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatMessageTime(conversation.last_message_at)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.last_message_preview || "Rozpocznij konwersację"}
                        </p>
                        {hasUnread && (
                          <Badge className="ml-2 h-5 px-1.5 min-w-[20px] justify-center">
                            {myParticipant.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </ScrollArea>
        </Card>

        {/* Okno czatu */}
        {selectedConversation && currentParticipant ? (
          <Card className="flex-1 flex flex-col h-full">
            {/* Nagłówek czatu */}
            <div className="p-4 border-b flex items-center gap-3">
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
                    : formatLastSeen(currentParticipant.user.last_seen_at)
                  }
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
                  <p className="text-muted-foreground">Ładowanie wiadomości...</p>
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
                  {messages.map((message) => {
                    const isMyMessage = message.sender_id === identity?.id;
                    const isRead = message.reads?.some(r => r.user_id !== identity?.id);

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isMyMessage ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-4 py-2",
                            isMyMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          
                          <div className={cn(
                            "flex items-center gap-1 mt-1",
                            isMyMessage ? "justify-end" : "justify-start"
                          )}>
                            <span className={cn(
                              "text-xs",
                              isMyMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {format(new Date(message.created_at), "HH:mm")}
                            </span>
                            
                            {isMyMessage && (
                              isRead ? (
                                <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                              ) : (
                                <Check className="h-3 w-3 text-primary-foreground/70" />
                              )
                            )}
                          </div>
                          
                          {message.is_edited && (
                            <span className={cn(
                              "text-xs",
                              isMyMessage ? "text-primary-foreground/50" : "text-muted-foreground"
                            )}>
                              (edytowano)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Pole wprowadzania */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex items-center gap-2"
              >
                <Button type="button" variant="ghost" size="icon">
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <Input
                  placeholder="Napisz wiadomość..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                
                <Button type="button" variant="ghost" size="icon">
                  <Smile className="h-4 w-4" />
                </Button>
                
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
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