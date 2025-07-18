// App.tsx
import { Authenticated, ErrorComponent, Refine } from "@refinedev/core";
import routerBindings, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { dataProvider, liveProvider } from "@refinedev/supabase";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { Layout } from "./components/layout";
import { authProvider, supabaseClient } from "./utility";

// Import all resources
import { profilesResource, profilesRoutes } from "./pages/profiles";
import { dancersResource, dancersRoutes } from "./pages/dancers";
import { danceSchoolsResource, danceSchoolsRoutes } from "./pages/dance-schools";
import { danceStylesResource, danceStylesRoutes } from "./pages/dance-styles";
import { matchesResource, matchesRoutes } from "./pages/matches";
import { outdoorEventsResource, outdoorEventsRoutes } from "./pages/outdoor-events";
import { schoolEventsResource, schoolEventsRoutes } from "./pages/school-events";
import { chatConversationsResource, chatConversationsRoutes } from "./pages/chat-conversations";

import { authRoutes } from "./pages/auth";
import LandingPage from "./pages/Landing";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Refine
        dataProvider={dataProvider(supabaseClient)}
        liveProvider={liveProvider(supabaseClient)}
        authProvider={authProvider}
        routerProvider={routerBindings}
        resources={[
          profilesResource,
          dancersResource,
          danceSchoolsResource,
          danceStylesResource,
          matchesResource,
          outdoorEventsResource,
          schoolEventsResource,
          chatConversationsResource,
        ]}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
          useNewQueryKeys: true,
          liveMode: "auto", // Enable realtime for chat
        }}
      >
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          {...authRoutes}

          {/* Dashboard route - dla zalogowanych użytkowników */}
          <Route
            path="/dashboard"
            element={
              <Authenticated
                key="dashboard"
                fallback={<CatchAllNavigate to="/login" />}
              >
                <Dashboard />
              </Authenticated>
            }
          />

          {/* Protected routes */}
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
            {...profilesRoutes}
            {...dancersRoutes}
            {...danceSchoolsRoutes}
            {...danceStylesRoutes}
            {...matchesRoutes}
            {...outdoorEventsRoutes}
            {...schoolEventsRoutes}
            {...chatConversationsRoutes}

            <Route path="*" element={<ErrorComponent />} />
          </Route>
        </Routes>

        <UnsavedChangesNotifier />
        <DocumentTitleHandler />
      </Refine>
    </BrowserRouter>
  );
}

export default App;