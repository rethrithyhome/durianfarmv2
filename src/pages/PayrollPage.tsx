import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Check, Clock, Wallet, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkers } from "@/hooks/useWorkers";
import { useWorkLogs, useSaveWorkLog, usePayrollPayments, useCreatePayrollPayment } from "@/hooks/usePayroll";
import { useCreateExpense } from "@/hooks/useExpenses";
import { can } from "@/lib/permissions";
import { cycleFor, shiftCycle, isInCycle, type PayrollCycle } from "@/lib/payroll";
import { fmtCurrency, toKhr } from "@/lib/currency";
import { fmtDate, todayISO } from "@/lib/format";
import { C, tint } from "@/lib/tokens";
import { StatCard, EmptyState, PrimaryButton, Badge, inputCls, inputStyle } from "@/components/ui/primitives";
import { SheetModal } from "@/components/ui/SheetModal";
import type { FarmSettings, Role, Worker } from "@/types/domain";

export function PayrollPage({ role, farm }: { role: Role; farm: FarmSettings }) {
  const { profile } = useAuth();
  const enabled = !!profile?.farmId;
  const workersQ = useWorkers(enabled);
  const logsQ = useWorkLogs(enabled);
  const paymentsQ = usePayrollPayments(enabled && can(role, "payWages"));
  const saveLogM = useSaveWorkLog();
  const createPaymentM = useCreatePayrollPayment();
  const createExpenseM = useCreateExpense();

  const [sub, setSub] = useState<"hours" | "settle">(can(role, "payWages") ? "settle" : "hours");
  const [cycle, setCycle] = useState<PayrollCycle>(() => cycleFor(new Date(), farm.payrollCycleStartDay));
  const [logDate, setLogDate] = useState(todayISO());
  const [hoursDraft, setHoursDraft] = useState<Record<string, string>>({});
  const [confirmPay, setConfirmPay] = useState<{ worker: Worker; amount: number } | null>(null);
  const [payBusy, setPayBusy] = useState(false);

  const workers = (workersQ.data ?? []).filter((w) => w.status === "active");
  const hourlyWorkers = workers.filter((w) => w.wageType === "hourly");
  const monthlyWorkers = workers.filter((w) => w.wageType === "monthly");
  const logs = logsQ.data ?? [];
  const payments = paymentsQ.data ?? [];

  /** Amount owed to a worker for the selected cycle, in their own wage currency. */
  const amountFor = (w: Worker): number => {
    if (w.wageType === "monthly") return w.wageRate;
    const hours = logs
      .filter((l) => l.workerId === w.id && isInCycle(l.date, cycle))
      .reduce((s, l) => s + l.hours, 0);
    return hours * w.wageRate;
  };
  const hoursFor = (w: Worker): number =>
    logs.filter((l) => l.workerId === w.id && isInCycle(l.date, cycle)).reduce((s, l) => s + l.hours, 0);

  const isPaid = (w: Worker) => payments.some((p) => p.workerId === w.id && p.cycleStart === cycle.start);

  const totalKhrDue = useMemo(
    () => workers.reduce((s, w) => (isPaid(w) ? s : s + toKhr(amountFor(w), w.wageCurrency, farm.exchangeRate)), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workers, logs, payments, cycle, farm.exchangeRate]
  );

  const saveHours = async (workerId: string) => {
    const raw = hoursDraft[workerId];
    if (raw === undefined || raw === "") return;
    await saveLogM.mutateAsync({ workerId, date: logDate, hours: Number(raw) || 0 });
    setHoursDraft((d) => { const next = { ...d }; delete next[workerId]; return next; });
  };

  const settlePayment = async () => {
    if (!confirmPay) return;
    const { worker, amount } = confirmPay;
    setPayBusy(true);
    try {
      const amountKhr = toKhr(amount, worker.wageCurrency, farm.exchangeRate);
      // Record the payroll payment, and mirror it into expenses so it
      // flows through the farm's profit/loss reporting automatically.
      const expense = await createExpenseM.mutateAsync({
        category: "labor",
        amount, currency: worker.wageCurrency, amountKhr, exchangeRate: farm.exchangeRate,
        date: todayISO(),
        note: `ប្រាក់ឈ្នួល ${worker.name} (${cycle.label})`,
      });
      await createPaymentM.mutateAsync({
        workerId: worker.id, cycleStart: cycle.start, cycleEnd: cycle.end,
        amount, currency: worker.wageCurrency, amountKhr, exchangeRate: farm.exchangeRate,
        paidDate: todayISO(), expenseId: expense.id,
      });
      setConfirmPay(null);
    } catch (err) {
      window.alert("បង់ប្រាក់មិនបានជោគជ័យ៖ " + (err instanceof Error ? err.message : String(err)));
    } finally { setPayBusy(false); }
  };

  return (
    <div className="pt-1 pb-4">
      {/* Cycle selector */}
      <div className="flex items-center justify-between rounded-2xl px-2 py-2 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <button onClick={() => setCycle(shiftCycle(cycle, farm.payrollCycleStartDay, -1))} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.bgAlt }}><ChevronLeft size={15} color={C.ink} /></button>
        <div className="text-center">
          <div className="text-xs font-semibold" style={{ color: C.green }}>{cycle.label}</div>
          <div className="text-[10px]" style={{ color: C.inkSoft }}>ខួបប្រាក់ឈ្នួល</div>
        </div>
        <button onClick={() => setCycle(shiftCycle(cycle, farm.payrollCycleStartDay, 1))} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.bgAlt }}><ChevronRight size={15} color={C.ink} /></button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <StatCard icon={Users} label="កម្មករប្រាក់ខែ" value={monthlyWorkers.length} />
        <StatCard icon={Clock} label="កម្មករប្រាក់ថ្ងៃ" value={hourlyWorkers.length} accent={C.blue} />
        {can(role, "payWages") && (
          <StatCard icon={Wallet} label="នៅសល់ត្រូវបង់" value={fmtCurrency(totalKhrDue, "KHR")} accent={C.red} sub={cycle.label} />
        )}
      </div>

      <div className="flex rounded-xl p-1 mb-3" style={{ background: C.bgAlt }}>
        <button onClick={() => setSub("hours")} className="flex-1 rounded-lg py-2 text-[11px] font-semibold" style={{ background: sub === "hours" ? C.card : "transparent", color: sub === "hours" ? C.green : C.inkSoft }}>កត់ត្រាម៉ោង</button>
        {can(role, "payWages") && (
          <button onClick={() => setSub("settle")} className="flex-1 rounded-lg py-2 text-[11px] font-semibold" style={{ background: sub === "settle" ? C.card : "transparent", color: sub === "settle" ? C.green : C.inkSoft }}>ទូទាត់ប្រាក់</button>
        )}
      </div>

      {sub === "hours" && (
        <>
          <div className="mb-3">
            <div className="text-[11px] mb-1.5" style={{ color: C.inkSoft }}>កាលបរិច្ឆេទ</div>
            <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className={inputCls} style={inputStyle} />
          </div>
          {hourlyWorkers.length === 0 ? (
            <EmptyState icon={Clock} title="គ្មានកម្មករប្រាក់ថ្ងៃ" hint="កម្មករដែលកំណត់ជាប្រភេទ 'ប្រាក់ថ្ងៃ' នឹងបង្ហាញនៅទីនេះ" />
          ) : (
            <div className="space-y-2">
              {hourlyWorkers.map((w) => {
                const existing = logs.find((l) => l.workerId === w.id && l.date === logDate);
                const draft = hoursDraft[w.id];
                const value = draft !== undefined ? draft : (existing?.hours?.toString() ?? "");
                const dirty = draft !== undefined && draft !== (existing?.hours?.toString() ?? "");
                return (
                  <div key={w.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: C.ink }}>{w.name}</div>
                      <div className="text-[10.5px]" style={{ color: C.inkSoft }}>
                        {can(role, "setWage") ? `${fmtCurrency(w.wageRate, w.wageCurrency)}/ម៉ោង · ` : ""}
                        ខួបនេះ {hoursFor(w)} ម៉ោង
                      </div>
                    </div>
                    <input
                      type="number" min="0" step="0.5" value={value}
                      onChange={(e) => setHoursDraft((d) => ({ ...d, [w.id]: e.target.value }))}
                      className="w-20 rounded-xl px-2.5 py-2 text-sm text-center outline-none"
                      style={inputStyle}
                      placeholder="ម៉ោង"
                    />
                    <button
                      onClick={() => saveHours(w.id)}
                      disabled={!dirty}
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40"
                      style={{ background: dirty ? C.green : C.bgAlt }}
                    >
                      <Check size={15} color={dirty ? "#fff" : C.inkSoft} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {sub === "settle" && can(role, "payWages") && (
        <>
          {workers.length === 0 ? (
            <EmptyState icon={Wallet} title="គ្មានកម្មករ" hint="បន្ថែមកម្មករ និងកំណត់ប្រាក់ឈ្នួលជាមុនសិន" />
          ) : (
            <div className="space-y-2">
              {workers.map((w) => {
                const amount = amountFor(w);
                const paid = isPaid(w);
                const payment = payments.find((p) => p.workerId === w.id && p.cycleStart === cycle.start);
                return (
                  <div key={w.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: C.ink }}>
                        {w.name}
                        <Badge label={w.wageType === "monthly" ? "ប្រាក់ខែ" : "ប្រាក់ថ្ងៃ"} color={w.wageType === "monthly" ? C.greenMid : C.blue} />
                      </div>
                      <div className="text-[10.5px]" style={{ color: C.inkSoft }}>
                        {w.wageType === "monthly"
                          ? `${fmtCurrency(w.wageRate, w.wageCurrency)}/ខែ`
                          : `${hoursFor(w)} ម៉ោង × ${fmtCurrency(w.wageRate, w.wageCurrency)}`}
                        {paid && payment ? ` · បង់ថ្ងៃ ${fmtDate(payment.paidDate)}` : ""}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold" style={{ color: paid ? C.inkSoft : C.green }}>{fmtCurrency(amount, w.wageCurrency)}</div>
                      {w.wageCurrency === "USD" && <div className="text-[10px]" style={{ color: C.inkSoft }}>≈ {fmtCurrency(toKhr(amount, "USD", farm.exchangeRate), "KHR")}</div>}
                    </div>
                    {paid ? (
                      <div className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0" style={{ background: tint(C.greenMid, 12), color: C.greenMid }}><Check size={11} /> បង់រួច</div>
                    ) : (
                      <button onClick={() => setConfirmPay({ worker: w, amount })} disabled={amount <= 0} className="rounded-xl px-3 py-1.5 text-[11px] font-semibold shrink-0 disabled:opacity-40" style={{ background: C.green, color: "#fff" }}>បង់ប្រាក់</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {confirmPay && (
        <SheetModal title="បញ្ជាក់ការបង់ប្រាក់" onClose={() => setConfirmPay(null)}>
          <div className="text-sm mb-1" style={{ color: C.ink }}>{confirmPay.worker.name}</div>
          <div className="text-[11px] mb-4" style={{ color: C.inkSoft }}>ខួប {cycle.label}</div>
          <div className="rounded-xl p-4 text-center mb-4" style={{ background: C.bgAlt }}>
            <div className="text-2xl font-bold" style={{ color: C.green }}>{fmtCurrency(confirmPay.amount, confirmPay.worker.wageCurrency)}</div>
            {confirmPay.worker.wageCurrency === "USD" && (
              <div className="text-[11px] mt-1" style={{ color: C.inkSoft }}>≈ {fmtCurrency(toKhr(confirmPay.amount, "USD", farm.exchangeRate), "KHR")}</div>
            )}
          </div>
          <div className="text-[11px] mb-4" style={{ color: C.inkSoft }}>ការបង់ប្រាក់នេះនឹងកត់ត្រាជាចំណាយ (ប្រភេទ "ប្រាក់ខែកម្មករ") ដោយស្វ័យប្រវត្តិ</div>
          <div className="flex gap-2">
            <button onClick={() => setConfirmPay(null)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{ background: C.bgAlt, color: C.ink }}>បោះបង់</button>
            <PrimaryButton full onClick={settlePayment} disabled={payBusy}>{payBusy ? "កំពុងកត់ត្រា..." : "បញ្ជាក់បង់ប្រាក់"}</PrimaryButton>
          </div>
        </SheetModal>
      )}
    </div>
  );
}
