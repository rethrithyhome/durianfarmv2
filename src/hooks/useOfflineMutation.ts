import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { enqueueMutation } from "@/lib/offlineQueue";
import { uid } from "@/lib/format";

function isNetworkError(err: unknown): boolean {
  if (!navigator.onLine) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /fetch|network|Network|Failed to fetch/i.test(msg);
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
    mutationFn: async (payload: Partial<T>): Promise<T & WithId> => {
      try {
        return await apiFn(payload);
      } catch (err) {
        if (isNetworkError(err)) {
          await enqueueMutation({ resource, action: "create", payload });
          return { ...(payload as T), id: `temp-${uid()}` } as T & WithId;
        }
        throw err;
      }
    },
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
    mutationFn: async (payload: T): Promise<T> => {
      try {
        return await apiFn(payload);
      } catch (err) {
        if (isNetworkError(err)) {
          await enqueueMutation({ resource, action: "update", payload });
          return payload;
        }
        throw err;
      }
    },
    onSuccess: (row) => {
      qc.setQueryData<T[]>(queryKey, (prev) => (prev ?? []).map((x) => (x.id === row.id ? row : x)));
    },
  });
}

/** Delete — removes locally immediately; queued if offline. */
export function useDeleteResource(resource: string, queryKey: QueryKey, apiFn: (id: string) => Promise<void>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      try {
        await apiFn(id);
      } catch (err) {
        if (isNetworkError(err)) {
          await enqueueMutation({ resource, action: "delete", payload: { id } });
        } else {
          throw err;
        }
      }
      return id;
    },
    onSuccess: (id) => {
      qc.setQueryData<WithId[]>(queryKey, (prev) => (prev ?? []).filter((x) => x.id !== id));
    },
  });
}
