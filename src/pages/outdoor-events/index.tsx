// src/pages/outdoor-events/index.tsx
import { Route } from "react-router";
import { OutdoorEventsList } from "./list";
import { OutdoorEventsCreate } from "./create";
import { OutdoorEventsEdit } from "./edit";
import { OutdoorEventsShow } from "./show";

// Komponenty
export { OutdoorEventsCreate } from "./create";
export { OutdoorEventsEdit } from "./edit";
export { OutdoorEventsList } from "./list";
export { OutdoorEventsShow } from "./show";

// Resource definition
export const outdoorEventsResource = {
  name: "outdoor_events",
  list: "/outdoor-events",
  create: "/outdoor-events/create",
  edit: "/outdoor-events/edit/:id",
  show: "/outdoor-events/show/:id",
  meta: {
    canDelete: true,
    label: "Wydarzenia plenerowe",
  },
};

// Routes
export const outdoorEventsRoutes = [
  <Route
    key="outdoor-events-list"
    path="/outdoor-events"
    element={<OutdoorEventsList />}
  />,
  <Route
    key="outdoor-events-create"
    path="/outdoor-events/create"
    element={<OutdoorEventsCreate />}
  />,
  <Route
    key="outdoor-events-edit"
    path="/outdoor-events/edit/:id"
    element={<OutdoorEventsEdit />}
  />,
  <Route
    key="outdoor-events-show"
    path="/outdoor-events/show/:id"
    element={<OutdoorEventsShow />}
  />,
];