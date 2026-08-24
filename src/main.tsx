import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { SWRConfig } from "swr";

import App from "./App.tsx";

import AuthSessionProvider from "@/features/auth/AuthSessionProvider";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";

const ROOT = document.getElementById("root");
if (!ROOT) throw new Error("Failed to find the root element");

createRoot(ROOT).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthSessionProvider>
          <SWRConfig value={{ suspense: true }}>
            <App />
          </SWRConfig>
        </AuthSessionProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
