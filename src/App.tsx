// src/App.tsx
import { Authenticated, ErrorComponent, Refine } from "@refinedev/core";
import routerBindings, {
  CatchAllNavigate,
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { dataProvider, liveProvider } from "@refinedev/supabase";
import { BrowserRouter, Outlet, Route, Routes, Navigate } from "react-router";
import { Layout } from "./components/layout";
import { authProvider, supabaseClient } from "./utility";

// Import zasobów
import { profilesResource, profilesRoutes } from "./pages/profiles";
import { danceStylesResource, danceStylesRoutes } from "./pages/dance-styles";
import { matchesResource, matchesRoutes } from "./pages/matches";
import { dancersResource, dancersRoutes } from "./pages/dancers";
import { eventsResource, eventsRoutes } from "./pages/events";
import { trainersResource, trainersRoutes } from "./pages/trainers";
import { chatResource, chatRoutes } from "./pages/chat"; // <-- NOWY IMPORT

import { authRoutes } from "./pages/auth";
import LandingPage from "./pages/Landing";

function App() {
  return (
    <BrowserRouter>
      <Refine
        dataProvider={dataProvider(supabaseClient)}
        liveProvider={liveProvider(supabaseClient)}
        authProvider={authProvider}
        routerProvider={routerBindings}
        resources={[
          dancersResource,     
          eventsResource,
             
          trainersResource,    
          profilesResource,    
          matchesResource,     
          danceStylesResource, 
          chatResource,   
        ]}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
          useNewQueryKeys: true,
          liveMode: "auto",
        }}
      >
        <Routes>
          {/* Publiczne trasy */}
          <Route path="/" element={<LandingPage />} />
          {...authRoutes}

          {/* Chronione trasy */}
          <Route
            element={
              <Authenticated
                key="protected-layout"
                fallback={<CatchAllNavigate to="/login" />}
              >
                <Layout>
                  <Outlet />
                </Layout>
              </Authenticated>
            }
          >
            {/* Przekierowanie z /profiles na /profiles/show jeśli to jest potrzebne */}
            <Route path="/profiles" element={<Navigate to="/profiles/show" replace />} />
            
            {...profilesRoutes}
            {...danceStylesRoutes}
            {...matchesRoutes}
            {...dancersRoutes}
            {...eventsRoutes}
            {...trainersRoutes}
            {...chatRoutes}      {/* <-- DODANE TRASY */}

            {/* Catch all dla nieznanych tras */}
            <Route path="*" element={<ErrorComponent />} />
          </Route>

          {/* Dodatkowe zabezpieczenie - jeśli użytkownik trafi na główną stronę będąc niezalogowanym */}
          <Route 
            path="*" 
            element={
              <Authenticated
                key="catch-all"
                fallback={<Navigate to="/login" replace />}
              >
                <Navigate to="/profiles" replace />
              </Authenticated>
            } 
          />
        </Routes>

        <UnsavedChangesNotifier />
        <DocumentTitleHandler />
      </Refine>
    </BrowserRouter>
  );
}

export default App;