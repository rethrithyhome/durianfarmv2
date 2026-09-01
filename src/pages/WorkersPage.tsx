import { useMemo, useState } from "react";
import { Search, Plus, Pencil, Trash2, Users, User, Wallet, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkers, useCreateWorker, useUpdateWorker, useDeleteWorker } from "@/hooks/useWorkers";
import { can } from "@/lib/permissions";
import { C } from "@/lib/tokens";
import { Badge, EmptyState, FilterChip, StatCard } from "@/components/ui/primitives";
import { fmtCurrency } from "@/lib/currency";
import { WorkerForm } from "@/components/workers/WorkerForm";
import type { FarmSettings, Role, WageType, Worker } from "@/types/domain";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export function WorkersPage({ role, farm }: { role: Role; farm: FarmSettings }) {
  const confirm = useConfirm();
  const { profile } = useAuth();
  const enabled = !!profile?.farmId;
  const workersQ = useWorkers(enabled);
  const createM = useCreateWorker();
  const updateM = useUpdateWorker();
  const deleteM = useDeleteWorker();

  const [q, setQ] = useState("");
  const [wageFilter, setWageFilter] = useState<WageType | "all">("all");
  const [modal, setModal] = useState<{ mode: "add" | "edit"; worker?: Worker } | null>(null);

  const workers = workersQ.data ?? [];
  const monthlyCount = workers.filter((w) => w.wageType === "monthly").length;
  const hourlyCount = workers.filter((w) => w.wageType === "hourly").length;

  const filtered = useMemo(() => workers.filter((w) => {
    const matchQ = !q || w.name.toLowerCase().includes(q.toLowerCase()) || (w.position ?? "").toLowerCase().includes(q.toLowerCase());
    const matchWage = wageFilter === "all" || w.wageType === wageFilter;
    return matchQ && matchWage;
  }), [workers, q, wageFilter]);

  return (
    <div className="pt-1 pb-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <Search size={15} color={C.inkSoft} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ស្វែងរកកម្មករ..." className="flex-1 bg-transparent text-xs outline-none" style={{ color: C.ink }} />
        </div>
        {can(role, "addWorker") && <button onClick={() => setModal({ mode: "add" })} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.green }}><Plus size={18} color="#fff" /></button>}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <StatCard icon={Users} label="កម្មករសរុប" value={workers.length} />
        <StatCard icon={Wallet} label="ប្រាក់ខែ" value={monthlyCount} accent={C.greenMid} />
        <StatCard icon={Clock} label="ប្រាក់ថ្ងៃ" value={hourlyCount} accent={C.blue} />
      </div>

      <div className="flex gap-1.5 overflow-x-auto mb-3 pb-0.5">
        <FilterChip active={wageFilter === "all"} onClick={() => setWageFilter("all")} label={`ទាំងអស់ (${workers.length})`} />
        <FilterChip active={wageFilter === "monthly"} onClick={() => setWageFilter("monthly")} label={`ប្រាក់ខែ (${monthlyCount})`} color={C.greenMid} />
        <FilterChip active={wageFilter === "hourly"} onClick={() => setWageFilter("hourly")} label={`ប្រាក់ថ្ងៃ (${hourlyCount})`} color={C.blue} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="មិនទាន់មានកម្មករ" hint="បន្ថែមកម្មករដំបូងរបស់អ្នក" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filtered.map((w) => (
            <div key={w.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: C.bgAlt }}>
                {w.photo ? <img src={w.photo} className="w-full h-full object-cover" alt="" /> : <User size={18} color={C.greenMid} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: C.ink }}>{w.name}</div>
                <div className="text-[11px] truncate" style={{ color: C.inkSoft }}>{w.position || "—"}{w.plot ? ` · ${w.plot}` : ""}{w.specialty ? ` · ${w.specialty}` : ""}</div>
                {can(role, "setWage") && w.wageRate > 0 && (
                  <div className="text-[10.5px] mt-0.5" style={{ color: C.greenMid }}>
                    {fmtCurrency(w.wageRate, w.wageCurrency)}{w.wageType === "monthly" ? "/ខែ" : "/ម៉ោង"}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge label={w.wageType === "monthly" ? "ប្រាក់ខែ" : "ប្រាក់ថ្ងៃ"} color={w.wageType === "monthly" ? C.greenMid : C.blue} />
                {w.status === "inactive" && <Badge label="ឈប់ធ្វើការ" color={C.red} />}
              </div>
              {can(role, "editWorker") && (
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setModal({ mode: "edit", worker: w })}><Pencil size={14} color={C.inkSoft} /></button>
                  {can(role, "deleteWorker") && <button onClick={async () => { if (await confirm({ title: "លុបកម្មករ?", message: `លុប "${w.name}" ចេញពីប្រព័ន្ធ? កំណត់ត្រាម៉ោងធ្វើការ និងការបើកប្រាក់របស់គាត់នឹងត្រូវលុបផងដែរ។`, confirmLabel: "លុប", danger: true })) deleteM.mutate(w.id); }}><Trash2 size={14} color={C.red} /></button>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <WorkerForm
          initial={modal.worker}
          allowedPlots={null}
          exchangeRate={farm.exchangeRate}
          canSetWage={can(role, "setWage")}
          onClose={() => setModal(null)}
          onSubmit={async (w) => { modal.mode === "add" ? await createM.mutateAsync(w) : await updateM.mutateAsync(w as Worker); }}
        />
      )}
    </div>
  );
}
