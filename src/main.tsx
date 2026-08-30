import { StrictMode } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { SWRConfig } from "swr";
import "./index.css";

import App from "./App.tsx";

import AuthSessionProvider from "@/features/auth/AuthSessionProvider";
import AppErrorBoundary from "@/shared/ui/AppErrorBoundary";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";

const ROOT = document.getElementById("root");
if (!ROOT) throw new Error("Failed to find the root element");

const ROUTER = createBrowserRouter([
  {
    path: "*",
    element: (
      <ToastProvider>
        <AuthSessionProvider>
          <SWRConfig value={{ suspense: true }}>
            <App />
          </SWRConfig>
        </AuthSessionProvider>
      </ToastProvider>
    ),
  },
]);

createRoot(ROOT).render(
  <StrictMode>
    <AppErrorBoundary>
      <RouterProvider router={ROUTER} />
    </AppErrorBoundary>
  </StrictMode>,
);
