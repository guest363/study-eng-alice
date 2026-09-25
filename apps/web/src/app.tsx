import { Navigate, Route, Routes } from "react-router-dom";
import { SiteHeader } from "./components/site-header";
import { MapPage } from "./pages/map-page";

export const App = () => (
  <>
    <SiteHeader />
    <Routes>
      <Route index element={<MapPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);
