import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "@/contexts/AuthContext";
import { DarkModeProvider } from "@/contexts/DarkModeContext";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { ToastProvider } from "@/components/ui/Toast";
import { applyThemeVars, DEFAULT_THEME } from "@/lib/theme";

// Apply a default theme's CSS variables immediately, before the first
// paint, so every screen (including the loading spinner and login page,
// which render before the farm's saved theme is known) has valid colors.
// Dark mode here mirrors DarkModeContext's own localStorage/system-
// preference check, so there's no flash of the wrong mode on load.
const storedDark = localStorage.getItem("durian-dark-mode");
const initialDark = storedDark !== null ? storedDark === "1" : (window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);
applyThemeVars(DEFAULT_THEME, initialDark);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DarkModeProvider>
          <ToastProvider>
            <ConfirmProvider>
              <App />
            </ConfirmProvider>
          </ToastProvider>
        </DarkModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
