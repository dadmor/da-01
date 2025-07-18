// src/pages/chat-conversations/index.tsx
import { Route } from "react-router";
import { ChatConversationsList } from "./list";
import { ChatConversationsShow } from "./show";

// Komponenty
export { ChatConversationsList } from "./list";
export { ChatConversationsShow } from "./show";

// Resource definition
export const chatConversationsResource = {
  name: "chat_conversations",
  list: "/chat",
  show: "/chat/:id",
  meta: {
    canDelete: false,
    label: "Czat",
  },
};

// Routes
export const chatConversationsRoutes = [
  <Route
    key="chat-conversations-list"
    path="/chat"
    element={<ChatConversationsList />}
  />,
  <Route
    key="chat-conversations-show"
    path="/chat/:id"
    element={<ChatConversationsShow />}
  />,
];