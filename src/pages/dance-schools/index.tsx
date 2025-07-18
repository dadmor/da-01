// src/pages/dance-schools/index.tsx
import { Route } from "react-router";
import { DanceSchoolsList } from "./list";
import { DanceSchoolsCreate } from "./create";
import { DanceSchoolsEdit } from "./edit";
import { DanceSchoolsShow } from "./show";

// Komponenty
export { DanceSchoolsCreate } from "./create";
export { DanceSchoolsEdit } from "./edit";
export { DanceSchoolsList } from "./list";
export { DanceSchoolsShow } from "./show";

// Resource definition
export const danceSchoolsResource = {
  name: "dance_schools",
  list: "/dance-schools",
  create: "/dance-schools/create",
  edit: "/dance-schools/edit/:id",
  show: "/dance-schools/show/:id",
  meta: {
    canDelete: true,
    label: "Szkoły tańca",
  },
};

// Routes
export const danceSchoolsRoutes = [
  <Route
    key="dance-schools-list"
    path="/dance-schools"
    element={<DanceSchoolsList />}
  />,
  <Route
    key="dance-schools-create"
    path="/dance-schools/create"
    element={<DanceSchoolsCreate />}
  />,
  <Route
    key="dance-schools-edit"
    path="/dance-schools/edit/:id"
    element={<DanceSchoolsEdit />}
  />,
  <Route
    key="dance-schools-show"
    path="/dance-schools/show/:id"
    element={<DanceSchoolsShow />}
  />,
];