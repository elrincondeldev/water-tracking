import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PopoverPage } from "@/pages/popover";
import { queryClient } from "./query/query-client";
import "./styles/index.css";

const root = document.getElementById("root");
if (!root) throw new Error("missing #root");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PopoverPage />
    </QueryClientProvider>
  </StrictMode>,
);
