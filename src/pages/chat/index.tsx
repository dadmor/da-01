// ------ src/pages/chat/index.tsx ------
import { Route } from "react-router";
import { ChatList } from "./list";

// Komponenty
export { ChatList } from "./list";

// Resource definition
export const chatResource = {
  name: "conversations",
  list: "/chat",
  meta: {
    label: "Czat",
  },
};

// Routes
export const chatRoutes = [
  <Route
    key="chat-list"
    path="/chat"
    element={<ChatList />}
  />,
];