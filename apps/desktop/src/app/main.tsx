import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { isTauri } from "@tauri-apps/api/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { persistOptions, queryClient } from "./query/query-client";
import "./styles/index.css";

const root = document.getElementById("root");
if (!root) throw new Error("missing #root");
if (isTauri()) document.documentElement.dataset.shell = "tauri";

createRoot(root).render(
  <StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <App />
    </PersistQueryClientProvider>
  </StrictMode>,
);
