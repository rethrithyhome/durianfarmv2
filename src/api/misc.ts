import { supabase } from "@/lib/supabaseClient";

export async function uploadPhoto(file: File, folder = "misc"): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from("photos").upload(path, file, { cacheControl: "3600", contentType: file.type || "image/jpeg" });
  if (up.error) throw up.error;
  return supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
}

const REALTIME_TABLES = [
  "workers", "trees", "care_logs", "yield_cycles", "yield_events",
  "expenses", "sale_locations", "customers", "sales", "profiles", "farms",
] as const;

export interface RealtimeChange {
  table: string;
  eventType: "INSERT" | "UPDATE" | "DELETE";
}

export function subscribeToFarm(farmId: string, onChange: (change: RealtimeChange) => void): () => void {
  const channel = supabase.channel(`farm-${farmId}`);
  REALTIME_TABLES.forEach((table) => {
    channel.on(
      "postgres_changes" as never,
      { event: "*", schema: "public", table },
      (payload: { eventType: RealtimeChange["eventType"] }) => onChange({ table, eventType: payload.eventType })
    );
  });
  channel.subscribe();
  return () => { supabase.removeChannel(channel); };
}
