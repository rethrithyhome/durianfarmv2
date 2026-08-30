import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queueCount } from "@/lib/offlineQueue";
import { flushQueue } from "@/lib/syncEngine";
import { qk } from "./queryKeys";

export function useOnlineSync() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(0);
  const qc = useQueryClient();

  const refreshPending = useCallback(async () => {
    setPending(await queueCount());
  }, []);

  const sync = useCallback(async () => {
    if (!navigator.onLine) return;
    const touched = new Set<string>();
    await flushQueue((resource) => touched.add(resource));
    touched.forEach((r) => qc.invalidateQueries({ queryKey: qk[r as keyof typeof qk] ?? [r] }));
    await refreshPending();
  }, [qc, refreshPending]);

  useEffect(() => {
    refreshPending();
    const onOnline = () => { setOnline(true); sync(); };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const interval = window.setInterval(() => { if (navigator.onLine) sync(); }, 30000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.clearInterval(interval);
    };
  }, [sync, refreshPending]);

  return { online, pending, syncNow: sync };
}
