// src/pages/school-events/index.tsx
import { Route } from "react-router";
import { SchoolEventsList } from "./list";
import { SchoolEventsCreate } from "./create";
import { SchoolEventsEdit } from "./edit";
import { SchoolEventsShow } from "./show";

// Komponenty
export { SchoolEventsCreate } from "./create";
export { SchoolEventsEdit } from "./edit";
export { SchoolEventsList } from "./list";
export { SchoolEventsShow } from "./show";

// Resource definition
export const schoolEventsResource = {
  name: "school_events",
  list: "/school-events",
  create: "/school-events/create",
  edit: "/school-events/edit/:id",
  show: "/school-events/show/:id",
  meta: {
    canDelete: true,
    label: "Wydarzenia szkół",
  },
};

// Routes
export const schoolEventsRoutes = [
  <Route
    key="school-events-list"
    path="/school-events"
    element={<SchoolEventsList />}
  />,
  <Route
    key="school-events-create"
    path="/school-events/create"
    element={<SchoolEventsCreate />}
  />,
  <Route
    key="school-events-edit"
    path="/school-events/edit/:id"
    element={<SchoolEventsEdit />}
  />,
  <Route
    key="school-events-show"
    path="/school-events/show/:id"
    element={<SchoolEventsShow />}
  />,
];