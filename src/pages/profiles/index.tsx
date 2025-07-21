// src/pages/profiles/index.tsx
import { Route } from "react-router";
import { ProfilesMain } from "./main";
import { ProfilesCreate } from "./create";
import { ProfilesEdit } from "./edit";

// Components export
export { ProfilesMain } from "./main";
export { ProfilesCreate } from "./create";
export { ProfilesEdit } from "./edit";

// Resource definition - BEZ ID, bo to profil zalogowanego użytkownika
export const profilesResource = {
  name: "profiles",
  list: "/profiles",
  create: "/profiles/create",
  edit: "/profiles/edit", // Bez :id
  meta: {
    label: "Mój Profil",
    icon: "User",
  },
};

// Routes - BEZ ID
export const profilesRoutes = [
  <Route
    key="profiles-main"
    path="/profiles"
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