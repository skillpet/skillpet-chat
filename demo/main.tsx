import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { setChatLanguage } from "@skillpet/chat-react";
import "./index.css";
import App from "./App";

const WelcomePage = lazy(() => import("./pages/WelcomePage"));
const ChatDemoPage = lazy(() => import("./pages/ChatDemoPage"));
const ApiDocPage = lazy(() => import("./pages/ApiDocPage"));
const BackendGuidePage = lazy(() => import("./pages/BackendGuidePage"));

try {
  const savedLang = localStorage.getItem("skillpet-chat-test-lang");
  if (savedLang) setChatLanguage(savedLang);
} catch {
  /* ignore */
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route element={<App />}>
            <Route index element={<WelcomePage />} />
            <Route path="demo" element={<ChatDemoPage />} />
            <Route path="api" element={<ApiDocPage />} />
            <Route path="backend" element={<BackendGuidePage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>
);
