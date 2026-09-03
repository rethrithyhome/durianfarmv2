import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "durian-dark-mode";

function getInitialDark(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) return stored === "1";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

interface DarkModeState {
  dark: boolean;
  toggle: () => void;
  setDark: (v: boolean) => void;
}

const DarkModeContext = createContext<DarkModeState | null>(null);

/** Dark mode is a per-device preference (night vs bright sunlight in the
 * field), not something that should sync across everyone's screens the
 * way the farm's color theme does — so it lives in localStorage, not
 * the database. */
export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [dark, setDarkState] = useState<boolean>(getInitialDark);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, dark ? "1" : "0");
  }, [dark]);

  const setDark = (v: boolean) => setDarkState(v);
  const toggle = () => setDarkState((d) => !d);

  return (
    <DarkModeContext.Provider value={{ dark, toggle, setDark }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode(): DarkModeState {
  const ctx = useContext(DarkModeContext);
  if (!ctx) throw new Error("useDarkMode must be used within DarkModeProvider");
  return ctx;
}
