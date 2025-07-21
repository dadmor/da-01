// src/pages/dancers/index.tsx
import { Route } from "react-router";
import { DancersList } from "./list";
import { DancersShow } from "./show";

// Komponenty - BEZ CREATE I EDIT!
export { DancersList };
export { DancersShow };

// Resource definition - tylko lista i podgląd
export const dancersResource = {
  name: "dancers",
  list: "/dancers",
  show: "/dancers/show/:id",
  meta: {
    canDelete: false,
    label: "Tancerze",
  },
};

// Routes - tylko lista i show
export const dancersRoutes = [
  <Route
    key="dancers-list"
    path="/dancers"
    element={<DancersList />}
  />,
  <Route
    key="dancers-show"
    path="/dancers/show/:id"
    element={<DancersShow />}
  />,
];