import { supabase, DEFAULT_FARM_ID } from "@/lib/supabaseClient";
import { must } from "./_shared";
import type { CareType, Task, TaskPriority, TaskStatus } from "@/types/domain";

interface TaskRow {
  id: string; title: string; description: string | null; care_type: CareType | null;
  plot: string | null; tree_id: string | null; worker_id: string | null; assignee_id: string | null;
  due_date: string | null; priority: TaskPriority; status: TaskStatus;
  completed_at: string | null; completed_by: string | null; created_by: string | null;
}
const fromRow = (r: TaskRow): Task => ({
  id: r.id, title: r.title, description: r.description, careType: r.care_type,
  plot: r.plot, treeId: r.tree_id, workerId: r.worker_id, assigneeId: r.assignee_id,
  dueDate: r.due_date, priority: r.priority, status: r.status,
  completedAt: r.completed_at, completedBy: r.completed_by, createdBy: r.created_by,
});
const toRow = (t: Partial<Task>, farmId: string) => ({
  farm_id: farmId, title: t.title, description: t.description || null, care_type: t.careType || null,
  plot: t.plot || null, tree_id: t.treeId || null, worker_id: t.workerId || null, assignee_id: t.assigneeId || null,
  due_date: t.dueDate || null, priority: t.priority ?? "normal", status: t.status ?? "open",
  completed_at: t.completedAt || null, completed_by: t.completedBy || null,
});

export async function listTasks(farmId: string = DEFAULT_FARM_ID): Promise<Task[]> {
  const rows = must(await supabase.from("tasks").select("*").eq("farm_id", farmId).order("created_at", { ascending: false }));
  return (rows as TaskRow[]).map(fromRow);
}
export async function createTask(t: Partial<Task>, farmId: string = DEFAULT_FARM_ID): Promise<Task> {
  const { data: { user } } = await supabase.auth.getUser();
  const row = { ...toRow(t, farmId), created_by: user?.id ?? null };
  return fromRow(must(await supabase.from("tasks").insert(row).select().single<TaskRow>()));
}
export async function updateTask(t: Task, farmId: string = DEFAULT_FARM_ID): Promise<Task> {
  return fromRow(must(await supabase.from("tasks").update(toRow(t, farmId)).eq("id", t.id).select().single<TaskRow>()));
}
/** Marking done stamps who completed it and when, for accountability. */
export async function setTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  const { data: { user } } = await supabase.auth.getUser();
  const patch = status === "done"
    ? { status, completed_at: new Date().toISOString(), completed_by: user?.id ?? null }
    : { status, completed_at: null, completed_by: null };
  return fromRow(must(await supabase.from("tasks").update(patch).eq("id", id).select().single<TaskRow>()));
}
export async function deleteTask(id: string): Promise<void> {
  must(await supabase.from("tasks").delete().eq("id", id));
}
