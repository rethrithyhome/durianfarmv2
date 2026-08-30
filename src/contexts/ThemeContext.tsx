import { createContext, useContext, useEffect, type ReactNode } from "react";
import { applyThemeVars, DEFAULT_THEME } from "@/lib/theme";

const ThemeContext = createContext<string>(DEFAULT_THEME);

export function ThemeProvider({ theme, children }: { theme: string; children: ReactNode }) {
  useEffect(() => { applyThemeVars(theme); }, [theme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useThemeKey(): string {
  return useContext(ThemeContext);
}
