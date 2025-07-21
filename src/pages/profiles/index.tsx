// src/pages/profiles/index.tsx
import { Route, Navigate } from "react-router-dom";
import { ProfilesMain } from "./main";
import { ProfilesCreate } from "./create";
import { ProfilesEdit } from "./edit";

// Components export
export { ProfilesMain } from "./main";
export { ProfilesCreate } from "./create";
export { ProfilesEdit } from "./edit";

// Resource definition - główna ścieżka to /profiles/main
export const profilesResource = {
  name: "profiles",
  list: "/profiles/main",
  create: "/profiles/create",
  edit: "/profiles/edit", // Bez :id
  meta: {
    label: "Mój Profil",
  },
};

// Routes - z przekierowaniem z /profiles na /profiles/main
export const profilesRoutes = [
  <Route
    key="profiles-redirect"
    path="/profiles"
    element={<Navigate to="/profiles/main" replace />}
  />,
  <Route
    key="profiles-main"
    path="/profiles/main"
    element={<ProfilesMain />}
  />,
  <Route
    key="profiles-create"
    path="/profiles/create"
    element={<ProfilesCreate />}
  />,
  <Route
    key="profiles-edit"
    path="/profiles/edit"
    element={<ProfilesEdit />}
  />,
];