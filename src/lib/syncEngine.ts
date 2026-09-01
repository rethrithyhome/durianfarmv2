import * as api from "@/api";
import { listQueue, removeMutation, type QueuedMutation } from "./offlineQueue";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Executor = (payload: any) => Promise<unknown>;

const executors: Record<string, Executor> = {
  "workers:create": api.createWorker,
  "workers:update": api.updateWorker,
  "workers:delete": (p) => api.deleteWorker(p.id),
  "trees:create": api.createTree,
  "trees:update": api.updateTree,
  "trees:delete": (p) => api.deleteTree(p.id),
  "careLogs:create": api.createCareLog,
  "careLogs:delete": (p) => api.deleteCareLog(p.id),
  "cycles:create": api.createCycle,
  "cycles:delete": (p) => api.deleteCycle(p.id),
  "events:create": api.createEvent,
  "events:delete": (p) => api.deleteEvent(p.id),
  "expenses:create": api.createExpense,
  "expenses:update": api.updateExpense,
  "expenses:delete": (p) => api.deleteExpense(p.id),
  "locations:create": api.createLocation,
  "locations:update": api.updateLocation,
  "locations:delete": (p) => api.deleteLocation(p.id),
  "customers:create": api.createCustomer,
  "customers:update": api.updateCustomer,
  "customers:delete": (p) => api.deleteCustomer(p.id),
  "tasks:create": api.createTask,
  "tasks:update": api.updateTask,
  "tasks:delete": (p) => api.deleteTask(p.id),
  "sales:create": api.createSale,
  "sales:update": api.updateSale,
  "sales:delete": (p) => api.deleteSale(p.id),
};

/**
 * Replays queued offline mutations against Supabase, in the order they
 * were made. Stops at the first failure (keeping it and everything after
 * it queued) so a later retry doesn't apply things out of order.
 * Calls onFlushed(resource) for every resource that had something synced,
 * so the caller knows which React Query caches to invalidate.
 */
export async function flushQueue(onFlushed?: (resource: string) => void): Promise<void> {
  const items: QueuedMutation[] = (await listQueue()).sort((a, b) => a.createdAt - b.createdAt);
  for (const item of items) {
    const key = `${item.resource}:${item.action}`;
    const exec = executors[key];
    if (!exec) { await removeMutation(item.id); continue; }
    try {
      await exec(item.payload);
      await removeMutation(item.id);
      onFlushed?.(item.resource);
    } catch (err) {
      console.error("offline sync failed for", key, err);
      break;
    }
  }
}
