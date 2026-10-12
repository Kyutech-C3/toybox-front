import { StrictMode } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  ScrollRestoration,
} from "react-router-dom";
import { createRoot } from "react-dom/client";
import { SWRConfig } from "swr";
import "./index.css";

import App from "./App.tsx";

import AuthSessionProvider from "@/features/auth/AuthSessionProvider";
import AppErrorBoundary, {
  AppErrorFallback,
} from "@/shared/ui/AppErrorBoundary";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import { restorePageScroll } from "@/util/pageScroll";
import { initializeTheme } from "@/util/theme";

initializeTheme();

const ROOT = document.getElementById("root");
if (!ROOT) throw new Error("Failed to find the root element");

// Router が移動前の位置を保存する前に、固定中の本文を元に戻す。
window.addEventListener("popstate", restorePageScroll);

const ROUTER = createBrowserRouter([
  {
    path: "*",
    errorElement: <AppErrorFallback />,
    element: (
      <ToastProvider>
        <AuthSessionProvider>
          <SWRConfig value={{ suspense: true }}>
            <App />
            <ScrollRestoration />
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
