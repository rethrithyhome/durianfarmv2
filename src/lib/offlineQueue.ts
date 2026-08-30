import { openDB, type IDBPDatabase } from "idb";

export type MutationAction = "create" | "update" | "delete";

export interface QueuedMutation {
  id: string;
  createdAt: number;
  resource: string;
  action: MutationAction;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}

let dbPromise: Promise<IDBPDatabase> | null = null;
function getDB() {
  if (!dbPromise) {
    dbPromise = openDB("durian-offline", 1, {
      upgrade(db) {
        db.createObjectStore("mutations", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export async function enqueueMutation(m: Omit<QueuedMutation, "id" | "createdAt">): Promise<QueuedMutation> {
  const db = await getDB();
  const record: QueuedMutation = { ...m, id: crypto.randomUUID(), createdAt: Date.now() };
  await db.add("mutations", record);
  return record;
}

export async function listQueue(): Promise<QueuedMutation[]> {
  const db = await getDB();
  return db.getAll("mutations");
}

export async function removeMutation(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("mutations", id);
}

export async function queueCount(): Promise<number> {
  const db = await getDB();
  return db.count("mutations");
}
