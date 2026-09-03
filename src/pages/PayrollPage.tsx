import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check, Clock, Wallet, Users, History, Trash2, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkers } from "@/hooks/useWorkers";
import { useWorkLogs, useSaveWorkLog, usePayrollPayments, useCreatePayrollPayment, useDeletePayrollPayment } from "@/hooks/usePayroll";
import { useCreateExpense } from "@/hooks/useExpenses";
import { can } from "@/lib/permissions";
import { cycleFor, shiftCycle, isInCycle, cycleWorkedFraction, type PayrollCycle } from "@/lib/payroll";
import { fmtCurrency, toKhr } from "@/lib/currency";
import { fmtDate, todayISO } from "@/lib/format";
import { errorMessage } from "@/lib/errors";
import { C, tint } from "@/lib/tokens";
import { GENDER_LABELS, genderColor } from "@/lib/constants";
import { WorkerAvatar } from "@/components/workers/WorkerAvatar";
import { StatCard, EmptyState, PrimaryButton, Badge, FilterChip, inputCls, inputStyle } from "@/components/ui/primitives";
import { SortMenu } from "@/components/ui/SortMenu";
import { Search } from "lucide-react";
import { SheetModal } from "@/components/ui/SheetModal";
import type { FarmSettings, Role, WageType, Worker, WorkLog } from "@/types/domain";
import { useConfirm } from "@/components/ui/ConfirmDialog";

type SubTab = "hours" | "salary" | "daily" | "history";

export function PayrollPage({ role, farm }: { role: Role; farm: FarmSettings }) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const enabled = !!profile?.farmId;
  const workersQ = useWorkers(enabled);
  const logsQ = useWorkLogs(enabled);
  const paymentsQ = usePayrollPayments(enabled && can(role, "payWages"));
  const saveLogM = useSaveWorkLog();
  const createPaymentM = useCreatePayrollPayment();
  const deletePaymentM = useDeletePayrollPayment();
  const createExpenseM = useCreateExpense();

  const [sub, setSub] = useState<SubTab>(can(role, "payWages") ? "daily" : "hours");
  const [cycle, setCycle] = useState<PayrollCycle>(() => cycleFor(new Date(), farm.payrollCycleStartDay));
  const [logDate, setLogDate] = useState(todayISO());
  const [hoursDraft, setHoursDraft] = useState<Record<string, string>>({});
  const [amountDraft, setAmountDraft] = useState<Record<string, string>>({});
  const [wageFilter, setWageFilter] = useState<WageType | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "amount">("name");
  const matchesSearch = (name: string) => !search || name.toLowerCase().includes(search.toLowerCase());

  // Flexible payout range for hourly workers — defaults to the last 7 days.
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const [rangeStart, setRangeStart] = useState(weekAgo);
  const [rangeEnd, setRangeEnd] = useState(todayISO());
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [confirmBatch, setConfirmBatch] = useState(false);
  const [confirmSalary, setConfirmSalary] = useState<{ worker: Worker; amount: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const workers = (workersQ.data ?? []).filter((w) => w.status === "active");
  const hourlyWorkers = workers.filter((w) => w.wageType === "hourly");
  const monthlyWorkers = workers.filter((w) => w.wageType === "monthly");
  const logs = logsQ.data ?? [];
  const payments = paymentsQ.data ?? [];

  /* ---------- hourly: unpaid days within the chosen range ---------- */
  const unpaidLogsFor = (workerId: string): WorkLog[] =>
    logs.filter((l) => l.workerId === workerId && !l.paymentId && l.date >= rangeStart && l.date <= rangeEnd);

  const hourlyRows = useMemo(() => hourlyWorkers.map((w) => {
    const unpaid = unpaidLogsFor(w.id);
    const byDay = w.dailyRateMode === "daily";
    // Flat-daily workers: the money entered each day IS the amount — it
    // varies (left an hour early, etc). Hourly workers: hours × rate.
    const days = unpaid.filter((l) => l.dayAmount != null).length;
    const hours = unpaid.reduce((s, l) => s + l.hours, 0);
    const amount = byDay ? unpaid.reduce((s, l) => s + (l.dayAmount ?? 0), 0) : hours * w.wageRate;
    const units = byDay ? days : hours;
    return { worker: w, unpaid, byDay, days, hours, units, amount, amountKhr: toKhr(amount, w.wageCurrency, farm.exchangeRate) };
  }).filter((r) => r.units > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hourlyWorkers, logs, rangeStart, rangeEnd, farm.exchangeRate]);

  const selectedRows = hourlyRows.filter((r) => selected[r.worker.id]);
  const batchTotalKhr = selectedRows.reduce((s, r) => s + r.amountKhr, 0);

  /* ---------- salaried: per-cycle, pro-rated ---------- */
  const salaryAmountFor = (w: Worker) => w.wageRate * cycleWorkedFraction(cycle, w.startDate);
  const salaryPaid = (w: Worker) =>
    payments.some((p) => p.workerId === w.id && p.wageType === "monthly" && p.cycleStart === cycle.start);

  const monthlyDueKhr = monthlyWorkers.reduce(
    (s, w) => (salaryPaid(w) ? s : s + toKhr(salaryAmountFor(w), w.wageCurrency, farm.exchangeRate)), 0);
  const hourlyDueKhr = hourlyRows.reduce((s, r) => s + r.amountKhr, 0);

  const hoursInCycle = (w: Worker) =>
    logs.filter((l) => l.workerId === w.id && isInCycle(l.date, cycle)).reduce((s, l) => s + l.hours, 0);
  const amountInCycle = (w: Worker) =>
    logs.filter((l) => l.workerId === w.id && isInCycle(l.date, cycle)).reduce((s, l) => s + (l.dayAmount ?? 0), 0);

  /* ---------- actions ---------- */
  const saveHours = async (workerId: string) => {
    const raw = hoursDraft[workerId];
    if (raw === undefined || raw === "") return;
    await saveLogM.mutateAsync({ workerId, date: logDate, hours: Number(raw) || 0 });
    setHoursDraft((d) => { const next = { ...d }; delete next[workerId]; return next; });
  };
  const saveAmount = async (workerId: string) => {
    const raw = amountDraft[workerId];
    if (raw === undefined || raw === "") return;
    await saveLogM.mutateAsync({ workerId, date: logDate, hours: 0, dayAmount: Number(raw) || 0 });
    setAmountDraft((d) => { const next = { ...d }; delete next[workerId]; return next; });
  };

  const payOne = async (worker: Worker, amount: number, opts: { wageType: WageType; start: string; end: string; hours?: number; logIds?: string[] }) => {
    const amountKhr = toKhr(amount, worker.wageCurrency, farm.exchangeRate);
    const label = opts.wageType === "monthly"
      ? `ប្រាក់ខែ ${worker.name} (${cycle.label})`
      : `ប្រាក់ថ្ងៃ ${worker.name} (${fmtDate(opts.start)} – ${fmtDate(opts.end)})`;
    const expense = await createExpenseM.mutateAsync({
      category: "labor", amount, currency: worker.wageCurrency, amountKhr,
      exchangeRate: farm.exchangeRate, date: todayISO(), note: label,
    });
    await createPaymentM.mutateAsync({
      payment: {
        workerId: worker.id, wageType: opts.wageType, hoursPaid: opts.hours ?? null,
        cycleStart: opts.start, cycleEnd: opts.end,
        amount, currency: worker.wageCurrency, amountKhr, exchangeRate: farm.exchangeRate,
        paidDate: todayISO(), expenseId: expense.id,
      },
      workLogIds: opts.logIds ?? [],
    });
  };

  const settleSalary = async () => {
    if (!confirmSalary) return;
    setBusy(true);
    try {
      await payOne(confirmSalary.worker, confirmSalary.amount, { wageType: "monthly", start: cycle.start, end: cycle.end });
      setConfirmSalary(null);
    } catch (err) { window.alert("បង់ប្រាក់មិនបានជោគជ័យ៖ " + errorMessage(err)); }
    finally { setBusy(false); }
  };

  const settleBatch = async () => {
    setBusy(true);
    try {
      for (const r of selectedRows) {
        await payOne(r.worker, r.amount, {
          wageType: "hourly", start: rangeStart, end: rangeEnd,
          hours: r.byDay ? r.days : r.hours, logIds: r.unpaid.map((l) => l.id),
        });
      }
      setSelected({});
      setConfirmBatch(false);
    } catch (err) { window.alert("បង់ប្រាក់មិនបានជោគជ័យ៖ " + errorMessage(err)); }
    finally { setBusy(false); }
  };

  const visibleHistory = payments.filter((p) => wageFilter === "all" || p.wageType === wageFilter)
    .sort((a, b) => sort === "name" ? a.paidDate.localeCompare(b.paidDate) * -1 : b.amountKhr - a.amountKhr);

  return (
    <div className="pt-1 pb-4">
      {can(role, "viewReports") && (
        <button onClick={() => navigate("/payroll-report")} className="w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 mb-3 text-xs font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.green }}>
          <FileText size={15} /> តារាងចំណាយប្រាក់ឈ្នួល (ព្រីន/CSV)
        </button>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <StatCard icon={Users} label="កម្មករប្រាក់ខែ" value={monthlyWorkers.length} accent={C.greenMid} />
        <StatCard icon={Clock} label="កម្មករប្រាក់ថ្ងៃ" value={hourlyWorkers.length} accent={C.blue} />
        {can(role, "payWages") && (
          <>
            <StatCard icon={Wallet} label="ប្រាក់ខែត្រូវបង់" value={fmtCurrency(monthlyDueKhr, "KHR")} accent={C.greenMid} sub={cycle.label} />
            <StatCard icon={Clock} label="ប្រាក់ថ្ងៃត្រូវបង់" value={fmtCurrency(hourlyDueKhr, "KHR")} accent={C.blue} sub="ក្នុងចន្លោះថ្ងៃដែលជ្រើស" />
          </>
        )}
      </div>

      <div className="flex rounded-xl p-1 mb-3 overflow-x-auto" style={{ background: C.bgAlt }}>
        {([
          { key: "hours", label: "កត់ត្រាម៉ោង", show: true },
          { key: "daily", label: "បើកប្រាក់ថ្ងៃ", show: can(role, "payWages") },
          { key: "salary", label: "បើកប្រាក់ខែ", show: can(role, "payWages") },
          { key: "history", label: "ប្រវត្តិ", show: can(role, "payWages") },
        ] as const).filter((t) => t.show).map((t) => (
          <button key={t.key} onClick={() => setSub(t.key)} className="flex-1 rounded-lg py-2 text-[11px] font-semibold whitespace-nowrap px-2"
            style={{ background: sub === t.key ? C.card : "transparent", color: sub === t.key ? C.green : C.inkSoft }}>
            {t.label}
          </button>
        ))}
      </div>

      {(sub === "hours" || sub === "daily" || sub === "salary") && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <Search size={15} color={C.inkSoft} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ស្វែងរកឈ្មោះកម្មករ..." className="flex-1 bg-transparent text-xs outline-none" style={{ color: C.ink }} />
        </div>
      )}

      {/* ---------------- HOURS ---------------- */}
      {sub === "hours" && (
        <>
          <div className="mb-3">
            <div className="text-[11px] mb-1.5" style={{ color: C.inkSoft }}>កាលបរិច្ឆេទ</div>
            <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className={inputCls} style={inputStyle} />
          </div>
          <div className="flex justify-end mb-2"><SortMenu value={sort} options={[{ key: "name", label: "ឈ្មោះ ក-អ" }, { key: "amount", label: "ម៉ោងច្រើនបំផុត" }]} onChange={setSort} /></div>
          {hourlyWorkers.filter((w) => matchesSearch(w.name)).length === 0 ? (
            <EmptyState icon={search ? Search : Clock} title={search ? "រកមិនឃើញកម្មករ" : "គ្មានកម្មករប្រាក់ថ្ងៃ"} hint={search ? `គ្មានកម្មករឈ្មោះត្រូវនឹង "${search}"` : "កម្មករដែលកំណត់ជាប្រភេទ 'ប្រាក់ថ្ងៃ' នឹងបង្ហាញនៅទីនេះ"} />
          ) : (
            <div className="space-y-2">
              {hourlyWorkers.filter((w) => matchesSearch(w.name))
                .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name, "km") : hoursInCycle(b) - hoursInCycle(a))
                .map((w) => {
                const existing = logs.find((l) => l.workerId === w.id && l.date === logDate);
                const locked = !!existing?.paymentId;
                const draft = hoursDraft[w.id];
                const value = draft !== undefined ? draft : (existing?.hours?.toString() ?? "");
                const dirty = draft !== undefined && draft !== (existing?.hours?.toString() ?? "");
                return (
                  <div key={w.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                    <WorkerAvatar photo={w.photo} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold flex items-center gap-1.5" style={{ color: C.ink }}>
                        <span className="truncate">{w.name}</span>
                        {w.gender && <Badge label={GENDER_LABELS[w.gender]} color={genderColor(w.gender)} />}
                      </div>
                      <div className="text-[10.5px]" style={{ color: C.inkSoft }}>
                        {can(role, "setWage") && w.dailyRateMode !== "daily" ? `${fmtCurrency(w.wageRate, w.wageCurrency)}/ម៉ោង · ` : ""}
                        {w.dailyRateMode === "daily" ? `ខួបនេះ ${fmtCurrency(amountInCycle(w), w.wageCurrency)}` : `ខួបនេះ ${hoursInCycle(w)} ម៉ោង`}
                        {locked && " · បើកប្រាក់រួច"}
                      </div>
                    </div>
                    {w.dailyRateMode === "daily" ? (
                      (() => {
                        const draftA = amountDraft[w.id];
                        const valueA = draftA !== undefined ? draftA : (existing?.dayAmount?.toString() ?? "");
                        const dirtyA = draftA !== undefined && draftA !== (existing?.dayAmount?.toString() ?? "");
                        return (
                          <>
                            <input type="number" min="0" step="500" value={valueA} disabled={locked}
                              onChange={(e) => setAmountDraft((d) => ({ ...d, [w.id]: e.target.value }))}
                              className="w-28 rounded-xl px-2.5 py-2 text-sm text-center outline-none disabled:opacity-50"
                              style={inputStyle} placeholder="ចំនួនប្រាក់" />
                            <button onClick={() => saveAmount(w.id)} disabled={!dirtyA || locked}
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40"
                              style={{ background: dirtyA && !locked ? C.green : C.bgAlt }}>
                              <Check size={15} color={dirtyA && !locked ? "#fff" : C.inkSoft} />
                            </button>
                          </>
                        );
                      })()
                    ) : (
                      <>
                        <input type="number" min="0" step="0.5" value={value} disabled={locked}
                          onChange={(e) => setHoursDraft((d) => ({ ...d, [w.id]: e.target.value }))}
                          className="w-20 rounded-xl px-2.5 py-2 text-sm text-center outline-none disabled:opacity-50"
                          style={inputStyle} placeholder="ម៉ោង" />
                        <button onClick={() => saveHours(w.id)} disabled={!dirty || locked}
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40"
                          style={{ background: dirty && !locked ? C.green : C.bgAlt }}>
                          <Check size={15} color={dirty && !locked ? "#fff" : C.inkSoft} />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ---------------- DAILY (flexible range, batch) ---------------- */}
      {sub === "daily" && can(role, "payWages") && (
        <>
          <div className="rounded-2xl p-3 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="text-[11px] mb-2" style={{ color: C.inkSoft }}>ជ្រើសចន្លោះថ្ងៃដែលចង់បើកប្រាក់ — បង្ហាញតែថ្ងៃដែលមិនទាន់បើក</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10.5px] mb-1" style={{ color: C.inkSoft }}>ពីថ្ងៃ</div>
                <input type="date" value={rangeStart} onChange={(e) => { setRangeStart(e.target.value); setSelected({}); }} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <div className="text-[10.5px] mb-1" style={{ color: C.inkSoft }}>ដល់ថ្ងៃ</div>
                <input type="date" value={rangeEnd} onChange={(e) => { setRangeEnd(e.target.value); setSelected({}); }} className={inputCls} style={inputStyle} />
              </div>
            </div>
          </div>

          {hourlyRows.filter((r) => matchesSearch(r.worker.name)).length === 0 ? (
            <EmptyState icon={search ? Search : Clock} title={search ? "រកមិនឃើញកម្មករ" : "គ្មានម៉ោងត្រូវបើកប្រាក់"} hint={search ? `គ្មានកម្មករឈ្មោះត្រូវនឹង "${search}"` : "គ្មានថ្ងៃធ្វើការដែលមិនទាន់បើកប្រាក់ក្នុងចន្លោះថ្ងៃនេះទេ"} />
          ) : (
            <>
              <div className="flex justify-end mb-2"><SortMenu value={sort} options={[{ key: "name", label: "ឈ្មោះ ក-អ" }, { key: "amount", label: "ចំនួនទឹកប្រាក់ច្រើនបំផុត" }]} onChange={setSort} /></div>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => {
                    const all = hourlyRows.every((r) => selected[r.worker.id]);
                    setSelected(all ? {} : Object.fromEntries(hourlyRows.map((r) => [r.worker.id, true])));
                  }}
                  className="text-[11px] font-semibold" style={{ color: C.greenMid }}
                >
                  {hourlyRows.every((r) => selected[r.worker.id]) ? "ដកការជ្រើសទាំងអស់" : "ជ្រើសទាំងអស់"}
                </button>
                <div className="text-[11px]" style={{ color: C.inkSoft }}>ជ្រើស {selectedRows.length}/{hourlyRows.length} នាក់</div>
              </div>

              <div className="space-y-2 mb-3">
                {hourlyRows.filter((r) => matchesSearch(r.worker.name))
                  .sort((a, b) => sort === "name" ? a.worker.name.localeCompare(b.worker.name, "km") : b.amountKhr - a.amountKhr)
                  .map((r) => {
                  const on = !!selected[r.worker.id];
                  return (
                    <button key={r.worker.id} onClick={() => setSelected((s) => ({ ...s, [r.worker.id]: !on }))}
                      className="w-full flex items-center gap-3 rounded-2xl p-3 text-left"
                      style={{ background: C.card, border: `1.5px solid ${on ? C.green : C.line}` }}>
                      <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                        style={{ background: on ? C.green : C.bgAlt, border: `1px solid ${on ? C.green : C.line}` }}>
                        {on && <Check size={13} color="#fff" />}
                      </div>
                      <WorkerAvatar photo={r.worker.photo} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold flex items-center gap-1.5" style={{ color: C.ink }}>
                          <span className="truncate">{r.worker.name}</span>
                          {r.worker.gender && <Badge label={GENDER_LABELS[r.worker.gender]} color={genderColor(r.worker.gender)} />}
                        </div>
                        <div className="text-[10.5px]" style={{ color: C.inkSoft }}>
                          {r.byDay ? `${r.days} ថ្ងៃ · ចំនួនប្រែប្រួលតាមថ្ងៃ` : `${r.unpaid.length} ថ្ងៃ · ${r.hours} ម៉ោង × ${fmtCurrency(r.worker.wageRate, r.worker.wageCurrency)}/ម៉ោង`}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold" style={{ color: C.green }}>{fmtCurrency(r.amount, r.worker.wageCurrency)}</div>
                        {r.worker.wageCurrency === "USD" && <div className="text-[10px]" style={{ color: C.inkSoft }}>≈ {fmtCurrency(r.amountKhr, "KHR")}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="sticky bottom-20 lg:bottom-4 rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: "var(--shadow-float)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px]" style={{ color: C.inkSoft }}>សរុបត្រូវបង់</div>
                  <div className="text-base font-bold" style={{ color: C.green }}>{fmtCurrency(batchTotalKhr, "KHR")}</div>
                </div>
                <PrimaryButton full onClick={() => setConfirmBatch(true)} disabled={selectedRows.length === 0}>
                  បើកប្រាក់ {selectedRows.length} នាក់
                </PrimaryButton>
              </div>
            </>
          )}
        </>
      )}

      {/* ---------------- SALARY (per cycle) ---------------- */}
      {sub === "salary" && can(role, "payWages") && (
        <>
          <div className="flex items-center justify-between rounded-2xl px-2 py-2 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <button onClick={() => setCycle(shiftCycle(cycle, farm.payrollCycleStartDay, -1))} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.bgAlt }}><ChevronLeft size={15} color={C.ink} /></button>
            <div className="text-center">
              <div className="text-xs font-semibold" style={{ color: C.green }}>{cycle.label}</div>
              <div className="text-[10px]" style={{ color: C.inkSoft }}>ខួបប្រាក់ខែ</div>
            </div>
            <button onClick={() => setCycle(shiftCycle(cycle, farm.payrollCycleStartDay, 1))} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.bgAlt }}><ChevronRight size={15} color={C.ink} /></button>
          </div>

          <div className="flex justify-end mb-2"><SortMenu value={sort} options={[{ key: "name", label: "ឈ្មោះ ក-អ" }, { key: "amount", label: "ចំនួនទឹកប្រាក់ច្រើនបំផុត" }]} onChange={setSort} /></div>
          {monthlyWorkers.filter((w) => matchesSearch(w.name)).length === 0 ? (
            <EmptyState icon={search ? Search : Wallet} title={search ? "រកមិនឃើញកម្មករ" : "គ្មានកម្មករប្រាក់ខែ"} hint={search ? `គ្មានកម្មករឈ្មោះត្រូវនឹង "${search}"` : "កម្មករដែលកំណត់ជាប្រភេទ 'ប្រាក់ខែ' នឹងបង្ហាញនៅទីនេះ"} />
          ) : (
            <div className="space-y-2">
              {monthlyWorkers.filter((w) => matchesSearch(w.name))
                .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name, "km") : salaryAmountFor(b) - salaryAmountFor(a))
                .map((w) => {
                const amount = salaryAmountFor(w);
                const paid = salaryPaid(w);
                const frac = cycleWorkedFraction(cycle, w.startDate);
                return (
                  <div key={w.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                    <WorkerAvatar photo={w.photo} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold flex items-center gap-1.5" style={{ color: C.ink }}>
                        <span className="truncate">{w.name}</span>
                        {w.gender && <Badge label={GENDER_LABELS[w.gender]} color={genderColor(w.gender)} />}
                      </div>
                      <div className="text-[10.5px]" style={{ color: C.inkSoft }}>
                        {fmtCurrency(w.wageRate, w.wageCurrency)}/ខែ{frac < 1 ? ` · ${Math.round(frac * 100)}% នៃខួប` : ""}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold" style={{ color: paid ? C.inkSoft : C.green }}>{fmtCurrency(amount, w.wageCurrency)}</div>
                      {w.wageCurrency === "USD" && <div className="text-[10px]" style={{ color: C.inkSoft }}>≈ {fmtCurrency(toKhr(amount, "USD", farm.exchangeRate), "KHR")}</div>}
                    </div>
                    {paid ? (
                      <div className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0" style={{ background: tint(C.greenMid, 12), color: C.greenMid }}><Check size={11} /> បង់រួច</div>
                    ) : (
                      <button onClick={() => setConfirmSalary({ worker: w, amount })} disabled={amount <= 0} className="rounded-xl px-3 py-1.5 text-[11px] font-semibold shrink-0 disabled:opacity-40" style={{ background: C.green, color: "#fff" }}>បង់ប្រាក់</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ---------------- HISTORY ---------------- */}
      {sub === "history" && can(role, "payWages") && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-1.5 overflow-x-auto flex-1 pb-0.5">
              <FilterChip active={wageFilter === "all"} onClick={() => setWageFilter("all")} label={`ទាំងអស់ (${payments.length})`} />
              <FilterChip active={wageFilter === "monthly"} onClick={() => setWageFilter("monthly")} label="ប្រាក់ខែ" color={C.greenMid} />
              <FilterChip active={wageFilter === "hourly"} onClick={() => setWageFilter("hourly")} label="ប្រាក់ថ្ងៃ" color={C.blue} />
            </div>
            <SortMenu value={sort} options={[{ key: "name", label: "ថ្ងៃថ្មីបំផុត" }, { key: "amount", label: "ចំនួនច្រើនបំផុត" }]} onChange={setSort} />
          </div>
          {visibleHistory.length === 0 ? (
            <EmptyState icon={History} title="មិនទាន់មានប្រវត្តិបើកប្រាក់" hint="ការបើកប្រាក់ទាំងអស់នឹងបង្ហាញនៅទីនេះ" />
          ) : (
            <div className="space-y-2">
              {visibleHistory.map((p) => {
                const w = (workersQ.data ?? []).find((x) => x.id === p.workerId);
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                    <WorkerAvatar photo={w?.photo} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: C.ink }}>
                        {w?.name ?? "—"}
                        <Badge label={p.wageType === "monthly" ? "ប្រាក់ខែ" : "ប្រាក់ថ្ងៃ"} color={p.wageType === "monthly" ? C.greenMid : C.blue} />
                      </div>
                      <div className="text-[10.5px]" style={{ color: C.inkSoft }}>
                        {fmtDate(p.cycleStart)} – {fmtDate(p.cycleEnd)}
                        {p.hoursPaid ? ` · ${p.hoursPaid} ${w?.dailyRateMode === "daily" ? "ថ្ងៃ" : "ម៉ោង"}` : ""} · បង់ថ្ងៃ {fmtDate(p.paidDate)}
                      </div>
                    </div>
                    <div className="text-sm font-bold shrink-0" style={{ color: C.green }}>{fmtCurrency(p.amount, p.currency)}</div>
                    <button onClick={async () => { if (await confirm({ title: "លុបការបើកប្រាក់?", message: "ថ្ងៃធ្វើការដែលការបើកប្រាក់នេះគ្របដណ្តប់ នឹងត្រឡប់ជា 'មិនទាន់បើក' វិញ ហើយកំណត់ត្រាចំណាយនៅតែមាន។", confirmLabel: "លុប", danger: true })) deletePaymentM.mutate(p.id); }}>
                      <Trash2 size={13} color={C.red} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ---------------- CONFIRMATIONS ---------------- */}
      {confirmBatch && (
        <SheetModal title="បញ្ជាក់ការបើកប្រាក់" onClose={() => setConfirmBatch(false)}>
          <div className="text-[11px] mb-3" style={{ color: C.inkSoft }}>
            ចន្លោះថ្ងៃ {fmtDate(rangeStart)} – {fmtDate(rangeEnd)} · {selectedRows.length} នាក់
          </div>
          <div className="rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${C.line}` }}>
            {selectedRows.map((r) => (
              <div key={r.worker.id} className="flex items-center justify-between px-3 py-2 text-xs" style={{ borderBottom: `1px solid ${C.line}` }}>
                <span style={{ color: C.ink }}>{r.worker.name} <span style={{ color: C.inkSoft }}>({r.byDay ? `${r.days}ថ្ងៃ` : `${r.hours}ម៉`})</span></span>
                <b style={{ color: C.green }}>{fmtCurrency(r.amount, r.worker.wageCurrency)}</b>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2.5" style={{ background: C.bgAlt }}>
              <span className="text-xs font-semibold" style={{ color: C.ink }}>សរុប</span>
              <b className="text-sm" style={{ color: C.green }}>{fmtCurrency(batchTotalKhr, "KHR")}</b>
            </div>
          </div>
          <div className="text-[11px] mb-4" style={{ color: C.inkSoft }}>ថ្ងៃធ្វើការទាំងនេះនឹងសម្គាល់ថាបើករួច ហើយកត់ត្រាជាចំណាយដោយស្វ័យប្រវត្តិ</div>
          <div className="flex gap-2">
            <button onClick={() => setConfirmBatch(false)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{ background: C.bgAlt, color: C.ink }}>បោះបង់</button>
            <PrimaryButton full onClick={settleBatch} disabled={busy}>{busy ? "កំពុងកត់ត្រា..." : "បញ្ជាក់បង់ប្រាក់"}</PrimaryButton>
          </div>
        </SheetModal>
      )}

      {confirmSalary && (
        <SheetModal title="បញ្ជាក់ការបង់ប្រាក់ខែ" onClose={() => setConfirmSalary(null)}>
          <div className="text-sm mb-1" style={{ color: C.ink }}>{confirmSalary.worker.name}</div>
          <div className="text-[11px] mb-4" style={{ color: C.inkSoft }}>ខួប {cycle.label}</div>
          <div className="rounded-xl p-4 text-center mb-4" style={{ background: C.bgAlt }}>
            <div className="text-2xl font-bold" style={{ color: C.green }}>{fmtCurrency(confirmSalary.amount, confirmSalary.worker.wageCurrency)}</div>
            {confirmSalary.worker.wageCurrency === "USD" && (
              <div className="text-[11px] mt-1" style={{ color: C.inkSoft }}>≈ {fmtCurrency(toKhr(confirmSalary.amount, "USD", farm.exchangeRate), "KHR")}</div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setConfirmSalary(null)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{ background: C.bgAlt, color: C.ink }}>បោះបង់</button>
            <PrimaryButton full onClick={settleSalary} disabled={busy}>{busy ? "កំពុងកត់ត្រា..." : "បញ្ជាក់បង់ប្រាក់"}</PrimaryButton>
          </div>
        </SheetModal>
      )}
    </div>
  );
}
