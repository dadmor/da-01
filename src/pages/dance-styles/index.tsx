// src/pages/dance-styles/index.tsx
import { Route } from "react-router";
import { DanceStylesList } from "./list";
import { DanceStylesCreate } from "./create";

// Komponenty
export { DanceStylesList } from "./list";
export { DanceStylesCreate } from "./create";

// Resource definition
export const danceStylesResource = {
  name: "dance_styles",
  list: "/dance-styles",
  create: "/dance-styles/create",
  meta: {
    canDelete: false,
    label: "Style tańca",
  },
};

// Routes
export const danceStylesRoutes = [
  <Route
    key="dance-styles-list"
    path="/dance-styles"
    element={<DanceStylesList />}
  />,
  <Route
    key="dance-styles-create"
    path="/dance-styles/create"
    element={<DanceStylesCreate />}
  />,
];