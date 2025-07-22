// ------ src/pages/profiles/index.tsx ------
import { Route } from "react-router";
import { ProfileEdit } from "./edit";
import { ProfileShow } from "./show";

// Komponenty
export { ProfileEdit } from "./edit";
export { ProfileShow } from "./show";

// Resource definition
export const profilesResource = {
  name: "users",
  list: "/profiles", // THIS IS REFINE DUMB MENU FIX
  show: "/profiles/show",
  edit: "/profiles/edit",
  meta: {
    label: "Mój Profil",
  },
};

// Routes
export const profilesRoutes = [
  <Route key="profiles-show" path="/profiles/show" element={<ProfileShow />} />,
  <Route key="profiles-edit" path="/profiles/edit" element={<ProfileEdit />} />,
];
