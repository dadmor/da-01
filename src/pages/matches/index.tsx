// src/pages/matches/index.tsx
import { Route } from "react-router";
import { MatchesList } from "./list";

// Komponenty
export { MatchesList } from "./list";

// Resource definition - używamy likes jako źródło danych
export const matchesResource = {
  name: "likes", // Zmiana! Używamy tabeli likes
  list: "/matches",
  meta: {
    canDelete: false,
    label: "Dopasowania",
  },
};

// Routes
export const matchesRoutes = [
  <Route
    key="matches-list"
    path="/matches"
    element={<MatchesList />}
  />,
];