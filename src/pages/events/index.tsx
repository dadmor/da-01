// ------ src/pages/events/index.tsx ------
import { Route } from "react-router";
import { EventsList } from "./list";
import { EventsShow } from "./show";
import { EventsCreate } from "./create";
import { EventsEdit } from "./edit";

// Komponenty
export { EventsList } from "./list";
export { EventsShow } from "./show";
export { EventsCreate } from "./create";
export { EventsEdit } from "./edit";

// Resource definition
export const eventsResource = {
  name: "events",
  list: "/events",
  show: "/events/show/:id",
  create: "/events/create",
  edit: "/events/edit/:id",
  meta: {
    label: "Wydarzenia",
  },
};

// Routes
export const eventsRoutes = [
  <Route
    key="events-list"
    path="/events"
    element={<EventsList />}
  />,
  <Route
    key="events-show"
    path="/events/show/:id"
    element={<EventsShow />}
  />,
  <Route
    key="events-create"
    path="/events/create"
    element={<EventsCreate />}
  />,
  <Route
    key="events-edit"
    path="/events/edit/:id"
    element={<EventsEdit />}
  />,
];