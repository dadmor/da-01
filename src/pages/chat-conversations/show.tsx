// src/pages/chat-conversations/show.tsx
import { useShow, useNavigation, useList, useCreate } from "@refinedev/core";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Send,
  Phone,
  Video,
  MoreVertical,
  Circle,
} from "lucide-react";
import { FlexBox } from "@/components/shared";
import { Badge, Button, Input, ScrollArea } from "@/components/ui";
import { useLoading } from "@/utility";
import { useState, useEffect, useRef } from "react";
import { supabaseClient } from "@/utility";

export const ChatConversationsShow = () => {
  const { queryResult } = useShow();
  const { list } = useNavigation();
  const [message, setMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = queryResult;
  const conversation = data?.data;

  // Fetch messages for this conversation
  const { 
    data: messagesData, 
    refetch: refetchMessages 
  } = useList({
    resource: "chat_messages",
    filters: [
      {
        field: "conversation_id",
        operator: "eq",
        value: conversation?.id,
      },
    ],
    sorters: [
      {
        field: "created_at",
        order: "asc",
      },
    ],
    pagination: { mode: "off" },
    queryOptions: {
      enabled: !!conversation?.id,
    },
  });

  const { mutate: sendMessage, isLoading: isSending } = useCreate();

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabaseClient
      .channel(`messages-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        () => {
          refetchMessages();
        }
      )
      .subscribe();

    // Mark messages as read
    supabaseClient
      .from('chat_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversation.id)
      .neq('sender_id', conversation.current_user_id)
      .then(() => {});

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [conversation?.id, refetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData]);

  const init = useLoading({ isLoading, isError });
  if (init) return init;

  if (!conversation) {
    return (
      <div className="p-6 mx-auto">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Rozmowa nie znaleziona</p>
          <Button className="mt-4" onClick={() => list("chat_conversations")}>
            Powrót do listy
          </Button>
        </div>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (!message.trim() || isSending) return;

    sendMessage(
      {
        resource: "chat_messages",
        values: {
          conversation_id: conversation.id,
          content: message.trim(),
          sender_id: conversation.current_user_id,
        },
      },
      {
        onSuccess: () => {
          setMessage("");
        },
      }
    );
  };

  const messages = messagesData?.data || [];
  const otherParticipant = conversation.other_participant;

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const groupMessagesByDate = (messages: any[]) => {
    const groups: { [key: string]: any[] } = {};
    
    messages.forEach((msg) => {
      const date = new Date(msg.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    
    return groups;
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Dzisiaj";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Wczoraj";
    } else {
      return date.toLocaleDateString("pl-PL", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="py-3">
          <FlexBox>
            <FlexBox variant="start" className="gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => list("chat_conversations")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Avatar>
                <AvatarImage src={otherParticipant?.photo_url} />
                <AvatarFallback>{otherParticipant?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{otherParticipant?.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {otherParticipant?.is_online ? (
                    <>
                      <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                      Online
                    </>
                  ) : (
                    `Ostatnio aktywny ${formatMessageTime(otherParticipant?.last_seen || conversation.updated_at)}`
                  )}
                </p>
              </div>
            </FlexBox>
            <FlexBox variant="end" className="gap-2">
              <Button variant="ghost" size="sm">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </FlexBox>
          </FlexBox>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          {Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex justify-center my-4">
                <Badge variant="secondary" className="text-xs">
                  {formatDateHeader(date)}
                </Badge>
              </div>
              {msgs.map((msg: any, index: number) => {
                const isOwnMessage = msg.sender_id === conversation.current_user_id;
                const showAvatar = !isOwnMessage && 
                  (index === 0 || msgs[index - 1]?.sender_id !== msg.sender_id);
                
                return (
                  <div
                    key={msg.id}
                    className={`mb-3 flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex gap-2 max-w-[70%] ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                      {!isOwnMessage && (
                        <div className="w-8">
                          {showAvatar && (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={otherParticipant?.photo_url} />
                              <AvatarFallback className="text-xs">
                                {otherParticipant?.name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwnMessage
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwnMessage ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {formatMessageTime(msg.created_at)}
                          {isOwnMessage && msg.is_read && " ✓✓"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </Card>

      {/* Input */}
      <Card className="mt-4">
        <CardContent className="p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <FlexBox className="gap-2">
              <Input
                placeholder="Napisz wiadomość..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSending}
                className="flex-1"
              />
              <Button type="submit" disabled={!message.trim() || isSending}>
                <Send className="w-4 h-4" />
              </Button>
            </FlexBox>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};