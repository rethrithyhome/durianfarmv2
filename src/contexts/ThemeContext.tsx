import { createContext, useContext, useEffect, type ReactNode } from "react";
import { applyThemeVars, DEFAULT_THEME } from "@/lib/theme";
import { useDarkMode } from "./DarkModeContext";

const ThemeContext = createContext<string>(DEFAULT_THEME);

export function ThemeProvider({ theme, children }: { theme: string; children: ReactNode }) {
  const { dark } = useDarkMode();
  useEffect(() => { applyThemeVars(theme, dark); }, [theme, dark]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useThemeKey(): string {
  return useContext(ThemeContext);
}
