import type { PostgrestSingleResponse, PostgrestResponse } from "@supabase/supabase-js";

export function must<T>(res: PostgrestSingleResponse<T> | PostgrestResponse<T>): T {
  if (res.error) throw res.error;
  return res.data as T;
}
