import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { SWRConfig } from "swr";

import App from "./App.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("Failed to find the root element");

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <SWRConfig value={{ suspense: true }}>
        <App />
      </SWRConfig>
    </BrowserRouter>
  </StrictMode>,
);
