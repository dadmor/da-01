import { Route } from "react-router";
import { MatchesList } from "./list";

// Komponenty
export { MatchesList } from "./list";

// Resource definition
export const matchesResource = {
  name: "matches",
  list: "/matches",
  meta: {
    label: "Dopasowania",
    icon: "HeartHandshake", // możesz użyć ikony
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