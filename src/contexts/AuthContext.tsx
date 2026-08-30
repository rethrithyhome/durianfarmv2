import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import * as api from "@/api";
import type { UserProfile } from "@/types/domain";

interface AuthState {
  loading: boolean;
  session: Session | null;
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refreshProfile = async () => {
    try { setProfile(await api.getMyProfile()); } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const unsub = api.onAuthChange(async (sess) => {
      setSession(sess);
      if (!sess) { setProfile(null); setLoading(false); return; }
      await refreshProfile();
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ loading, session, profile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
