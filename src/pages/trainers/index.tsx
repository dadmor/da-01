// src/pages/trainers/index.tsx
import { Route } from "react-router";
import { TrainersList } from "./list";
import { TrainerBooking } from "./booking";

// Komponenty
export { TrainersList } from "./list";
export { TrainerBooking } from "./booking";

// Resource definition
export const trainersResource = {
  name: "trainers",
  list: "/trainers",
  meta: {
    label: "Znajdź trenera",
  },
};

// Routes
export const trainersRoutes = [
  <Route
    key="trainers-list"
    path="/trainers"
    element={<TrainersList />}
  />,
  <Route
    key="trainer-booking"
    path="/trainers/:trainerId/booking"
    element={<TrainerBooking />}
  />,
];