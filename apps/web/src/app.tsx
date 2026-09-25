/**
 * Маршруты приложения (task.md G3, задача 1): карта, регион, поручение, сад, отряд,
 * родительский уголок, обучение.
 */
import { Navigate, Route, Routes } from "react-router-dom";
import { SiteHeader } from "./components/site-header";
import { GardenPage } from "./pages/garden-page";
import { HowToPlayPage } from "./pages/how-to-play-page";
import { MapPage } from "./pages/map-page";
import { OnboardingPage } from "./pages/onboarding-page";
import { ParentPage } from "./pages/parent-page";
import { PartyPage } from "./pages/party-page";
import { RegionPage } from "./pages/region-page";
import { SessionPage } from "./pages/session-page";

export const App = () => (
  <>
    <SiteHeader />
    <Routes>
      <Route index element={<MapPage />} />
      <Route path="onboarding" element={<OnboardingPage />} />
      <Route path="how-to-play" element={<HowToPlayPage />} />
      <Route path="region/:slug" element={<RegionPage />} />
      <Route path="session/:questId" element={<SessionPage />} />
      <Route path="garden" element={<GardenPage />} />
      <Route path="party" element={<PartyPage />} />
      <Route path="parent" element={<ParentPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);
