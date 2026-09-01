import { useMemo, useState } from "react";
import { Plus, Check, Pencil, Trash2, ClipboardList, CalendarClock, MapPin, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useSetTaskStatus } from "@/hooks/useTasks";
import { useWorkers } from "@/hooks/useWorkers";
import { useTrees } from "@/hooks/useTrees";
import { useUsers } from "@/hooks/useUsers";
import { can } from "@/lib/permissions";
import { careInfo } from "@/lib/constants";
import { fmtDate, todayISO } from "@/lib/format";
import { C, tint } from "@/lib/tokens";
import { EmptyState, FilterChip, Badge } from "@/components/ui/primitives";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { TaskForm } from "@/components/tasks/TaskForm";
import type { Role, Task } from "@/types/domain";

const PRIORITY_META: Record<Task["priority"], { label: string; color: string }> = {
  low: { label: "ធម្មតា", color: "#5B6650" },
  normal: { label: "សំខាន់", color: "#B9832C" },
  high: { label: "បន្ទាន់", color: "#B54B3A" },
};

type Filter = "mine" | "open" | "done";

export function TasksPage({ role }: { role: Role }) {
  const { profile } = useAuth();
  const confirm = useConfirm();
  const enabled = !!profile?.farmId;
  const tasksQ = useTasks(enabled);
  const workersQ = useWorkers(enabled);
  const treesQ = useTrees(enabled);
  const usersQ = useUsers(enabled && can(role, "viewUsers"));
  const createM = useCreateTask();
  const updateM = useUpdateTask();
  const deleteM = useDeleteTask();
  const statusM = useSetTaskStatus();

  const canAssign = can(role, "assignTask");
  const [filter, setFilter] = useState<Filter>(canAssign ? "open" : "mine");
  const [modal, setModal] = useState<{ mode: "add" | "edit"; task?: Task } | null>(null);

  const tasks = tasksQ.data ?? [];
  const workers = workersQ.data ?? [];
  const trees = treesQ.data ?? [];
  const users = usersQ.data ?? [];
  const plots = useMemo(() => Array.from(new Set(trees.map((t) => t.plot).filter((p): p is string => !!p))).sort(), [trees]);

  const mine = tasks.filter((t) => t.status === "open" && (!t.assigneeId || t.assigneeId === profile?.id));
  const open = tasks.filter((t) => t.status === "open");
  const done = tasks.filter((t) => t.status === "done");
  const visible = filter === "mine" ? mine : filter === "open" ? open : done;

  const workerName = (id?: string | null) => workers.find((w) => w.id === id)?.name;
  const treeCode = (id?: string | null) => trees.find((t) => t.id === id)?.code;
  const overdue = (t: Task) => t.status === "open" && !!t.dueDate && t.dueDate < todayISO();

  return (
    <div className="pt-1 pb-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1.5 overflow-x-auto flex-1 pb-0.5">
          <FilterChip active={filter === "mine"} onClick={() => setFilter("mine")} label={`ការងាររបស់ខ្ញុំ (${mine.length})`} color={C.greenMid} />
          <FilterChip active={filter === "open"} onClick={() => setFilter("open")} label={`កំពុងរង់ចាំ (${open.length})`} />
          <FilterChip active={filter === "done"} onClick={() => setFilter("done")} label={`រួចរាល់ (${done.length})`} color={C.blue} />
        </div>
        {canAssign && (
          <button onClick={() => setModal({ mode: "add" })} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.green }}>
            <Plus size={18} color="#fff" />
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={filter === "done" ? "មិនទាន់មានការងាររួចរាល់" : "គ្មានការងារត្រូវធ្វើ"}
          hint={canAssign ? "ចុចប៊ូតុង + ដើម្បីចាត់តាំងការងារឲ្យកម្មករ" : "ការងារដែលចាត់តាំងឲ្យអ្នក នឹងបង្ហាញនៅទីនេះ"}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {visible.map((t) => {
            const pm = PRIORITY_META[t.priority];
            const ci = t.careType ? careInfo(t.careType) : null;
            const isDone = t.status === "done";
            const late = overdue(t);
            return (
              <div key={t.id} className="rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${late ? tint(C.red, 35) : C.line}` }}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => statusM.mutate({ id: t.id, status: isDone ? "open" : "done" })}
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: isDone ? C.greenMid : C.bgAlt, border: `1.5px solid ${isDone ? C.greenMid : C.line}` }}
                    title={isDone ? "សម្គាល់ថាមិនទាន់រួច" : "សម្គាល់ថារួចរាល់"}
                  >
                    {isDone ? <Check size={14} color="#fff" /> : <span className="w-3 h-3 rounded-sm" style={{ background: "transparent" }} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: C.ink, textDecoration: isDone ? "line-through" : "none", opacity: isDone ? 0.6 : 1 }}>
                      {t.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {!isDone && <Badge label={pm.label} color={pm.color} />}
                      {ci && <span className="text-[10.5px] flex items-center gap-1" style={{ color: ci.color }}><ci.icon size={11} /> {ci.label}</span>}
                      {t.plot && <span className="text-[10.5px] flex items-center gap-1" style={{ color: C.inkSoft }}><MapPin size={10} /> {t.plot}</span>}
                      {t.treeId && <span className="text-[10.5px]" style={{ color: C.inkSoft }}>{treeCode(t.treeId)}</span>}
                    </div>
                    <div className="text-[10.5px] mt-1" style={{ color: late ? C.red : C.inkSoft }}>
                      {t.dueDate && <span className="inline-flex items-center gap-1"><CalendarClock size={10} /> {fmtDate(t.dueDate)}{late ? " · ហួសកំណត់" : ""}</span>}
                      {t.workerId && <span>{t.dueDate ? " · " : ""}{workerName(t.workerId)}</span>}
                    </div>
                    {t.description && <div className="text-[11px] mt-1.5" style={{ color: C.inkSoft }}>{t.description}</div>}
                  </div>
                  {canAssign && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={() => setModal({ mode: "edit", task: t })}><Pencil size={13} color={C.inkSoft} /></button>
                      {can(role, "deleteTask") && (
                        <button onClick={async () => {
                          if (await confirm({ title: "លុបការងារ?", message: `លុប "${t.title}" ចេញពីបញ្ជីការងារ?`, confirmLabel: "លុប", danger: true })) deleteM.mutate(t.id);
                        }}><Trash2 size={13} color={C.red} /></button>
                      )}
                    </div>
                  )}
                </div>
                {isDone && t.completedAt && (
                  <button onClick={() => statusM.mutate({ id: t.id, status: "open" })} className="flex items-center gap-1 text-[10px] mt-2 ml-10" style={{ color: C.inkSoft }}>
                    <RotateCcw size={10} /> បើកឡើងវិញ
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <TaskForm
          initial={modal.task}
          workers={workers}
          trees={trees}
          users={users}
          plots={plots}
          onClose={() => setModal(null)}
          onSubmit={async (t) => { modal.mode === "add" ? await createM.mutateAsync(t) : await updateM.mutateAsync(t as Task); }}
        />
      )}
    </div>
  );
}
