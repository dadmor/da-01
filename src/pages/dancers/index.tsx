// src/pages/dancers/index.tsx
import { Route } from "react-router";
import { DancersList } from "./list";
import { DancersCreate } from "./create";
import { DancersEdit } from "./edit";
import { DancersShow } from "./show";

// Komponenty
export { DancersCreate } from "./create";
export { DancersEdit } from "./edit";
export { DancersList } from "./list";
export { DancersShow } from "./show";

// Resource definition
export const dancersResource = {
  name: "dancers",
  list: "/dancers",
  create: "/dancers/create",
  edit: "/dancers/edit/:id",
  show: "/dancers/show/:id",
  meta: {
    canDelete: true,
    label: "Tancerze",
  },
};

// Routes
export const dancersRoutes = [
  <Route
    key="dancers-list"
    path="/dancers"
    element={<DancersList />}
  />,
  <Route
    key="dancers-create"
    path="/dancers/create"
    element={<DancersCreate />}
  />,
  <Route
    key="dancers-edit"
    path="/dancers/edit/:id"
    element={<DancersEdit />}
  />,
  <Route
    key="dancers-show"
    path="/dancers/show/:id"
    element={<DancersShow />}
  />,
];