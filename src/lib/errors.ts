/**
 * Supabase/Postgrest errors are plain objects, not Error instances, so
 * String(err) yields "[object Object]". This digs out whatever readable
 * detail is available and includes the Postgres error code, which is
 * what actually identifies the problem (e.g. 42703 = column missing,
 * 23514 = check constraint violated).
 */
export function errorMessage(err: unknown): string {
  if (!err) return "មិនស្គាល់មូលហេតុ";
  if (typeof err === "string") return err;
  if (err instanceof Error && err.message) return err.message;

  const e = err as { message?: string; details?: string; hint?: string; code?: string; error_description?: string };
  const parts = [e.message, e.details, e.hint, e.error_description].filter(Boolean);
  const text = parts.length ? parts.join(" — ") : JSON.stringify(err);
  return e.code ? `[${e.code}] ${text}` : text;
}
