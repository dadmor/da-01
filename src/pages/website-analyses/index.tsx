import { Route } from "react-router";
import { WebsiteAnalysisList } from "./list";
import { WebsiteAnalysisCreate } from "./create";
import { WebsiteAnalysisEdit } from "./edit";
import { WebsiteAnalysisShow } from "./show";

// Komponenty
export { WebsiteAnalysisCreate } from "./create";
export { WebsiteAnalysisEdit } from "./edit";
export { WebsiteAnalysisList } from "./list";
export { WebsiteAnalysisShow } from "./show";

// Resource definition
export const websiteAnalysisResource = {
  name: "website_analyses",
  list: "/website-analyses",
  create: "/website-analyses/create",
  edit: "/website-analyses/edit/:id",
  show: "/website-analyses/show/:id",
  meta: {
    canDelete: true,
    label: "Lista przetworzonych stron",
  },
};

// Routes
export const websiteAnalysisRoutes = [
  <Route
    key="website-analyses-list"
    path="/website-analyses"
    element={<WebsiteAnalysisList />}
  />,
  <Route
    key="website-analyses-create"
    path="/website-analyses/create"
    element={<WebsiteAnalysisCreate />}
  />,
  <Route
    key="website-analyses-edit"
    path="/website-analyses/edit/:id"
    element={<WebsiteAnalysisEdit />}
  />,
  <Route
    key="website-analyses-show"
    path="/website-analyses/show/:id"
    element={<WebsiteAnalysisShow />}
  />,
];
