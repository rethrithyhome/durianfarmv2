import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { enqueueMutation, type MutationAction } from "@/lib/offlineQueue";
import { uid } from "@/lib/format";

// If a real network round-trip hasn't finished in this long, treat it as
// failed rather than let the UI hang — a weak/degrading signal in the
// field can otherwise leave a fetch() pending for a very long time
// (sometimes indefinitely) instead of rejecting quickly.
const NETWORK_TIMEOUT_MS = 7000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("TIMEOUT")), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

function isNetworkError(err: unknown): boolean {
  if (!navigator.onLine) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /fetch|network|Network|Failed to fetch|TIMEOUT/i.test(msg);
}

/**
 * Runs apiCall(), but:
 * - if the browser already reports offline, skips the network attempt
 *   entirely and queues immediately (near-instant — never blocks the UI)
 * - otherwise races it against a timeout, queuing on failure or timeout
 * so a modal can never get stuck waiting on a connection that isn't
 * actually going to come through in time.
 */
async function runOrQueue<T>(resource: string, action: MutationAction, payload: unknown, apiCall: () => Promise<T>, offlineResult: () => T): Promise<T> {
  if (!navigator.onLine) {
    await enqueueMutation({ resource, action, payload });
    return offlineResult();
  }
  try {
    return await withTimeout(apiCall(), NETWORK_TIMEOUT_MS);
  } catch (err) {
    if (isNetworkError(err)) {
      await enqueueMutation({ resource, action, payload });
      return offlineResult();
    }
    throw err;
  }
}

interface WithId { id: string }

/** Create — on network failure, queues the write and adds an optimistic
 * temp row to the cache (replaced with the real row once synced). */
export function useCreateResource<T extends Partial<WithId>>(
  resource: string,
  queryKey: QueryKey,
  apiFn: (payload: Partial<T>) => Promise<T & WithId>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<T>): Promise<T & WithId> =>
      runOrQueue(resource, "create", payload, () => apiFn(payload), () => ({ ...(payload as T), id: `temp-${uid()}` } as T & WithId)),
    onSuccess: (row) => {
      qc.setQueryData<(T & WithId)[]>(queryKey, (prev) => [row, ...(prev ?? [])]);
    },
  });
}

/** Update — optimistic local patch either way; queued if offline. */
export function useUpdateResource<T extends WithId>(
  resource: string,
  queryKey: QueryKey,
  apiFn: (payload: T) => Promise<T>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: T): Promise<T> =>
      runOrQueue(resource, "update", payload, () => apiFn(payload), () => payload),
    onSuccess: (row) => {
      qc.setQueryData<T[]>(queryKey, (prev) => (prev ?? []).map((x) => (x.id === row.id ? row : x)));
    },
  });
}

/** Delete — removes locally immediately; queued if offline. */
export function useDeleteResource(resource: string, queryKey: QueryKey, apiFn: (id: string) => Promise<void>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<string> =>
      runOrQueue(resource, "delete", { id }, () => apiFn(id), () => undefined).then(() => id),
    onSuccess: (id) => {
      qc.setQueryData<WithId[]>(queryKey, (prev) => (prev ?? []).filter((x) => x.id !== id));
    },
  });
}
