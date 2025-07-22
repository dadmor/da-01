// ------ src/pages/dancers/index.tsx ------
import { Route } from "react-router";
import { DancersList } from "./list";
import { DancersShow } from "./show";

// Komponenty
export { DancersList } from "./list";
export { DancersShow } from "./show";

// Resource definition
export const dancersResource = {
  name: "v_public_dancers",
  list: "/dancers",
  show: "/dancers/show/:id",
  meta: {
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
    key="dancers-show"
    path="/dancers/show/:id"
    element={<DancersShow />}
  />,
];
