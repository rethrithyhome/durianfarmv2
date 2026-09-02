import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmSettings } from "@/hooks/useFarmSettings";
import { useWorkers } from "@/hooks/useWorkers";
import { useWorkLogs, usePayrollPayments } from "@/hooks/usePayroll";
import { cycleFor, shiftCycle, cycleWorkedFraction } from "@/lib/payroll";
import { fmtCurrency, toKhr } from "@/lib/currency";
import { fmtDate, todayISO } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import { C } from "@/lib/tokens";
import { inputCls, inputStyle } from "@/components/ui/primitives";

type Mode = "daily" | "salary";

export function PayrollReportPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const enabled = !!profile?.farmId;
  const farmQ = useFarmSettings(enabled);
  const workersQ = useWorkers(enabled);
  const logsQ = useWorkLogs(enabled);
  const paymentsQ = usePayrollPayments(enabled);

  const farm = farmQ.data;
  const [mode, setMode] = useState<Mode>("daily");
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const [start, setStart] = useState(weekAgo);
  const [end, setEnd] = useState(todayISO());
  const [cycleRef, setCycleRef] = useState(new Date());

  const cycle = useMemo(
    () => cycleFor(cycleRef, farm?.payrollCycleStartDay ?? 1),
    [cycleRef, farm?.payrollCycleStartDay]
  );

  const workers = (workersQ.data ?? []).filter((w) => w.status === "active");
  const logs = logsQ.data ?? [];
  const payments = paymentsQ.data ?? [];
  const rate = farm?.exchangeRate ?? 4100;

  /* One row per (worker, day) within the chosen range — a full ledger,
     not an aggregate — so each day's actual pay is visible on its own
     line. Useful both as a payment request and as a record afterwards. */
  const dailyLedger = useMemo(() => {
    const rows = workers
      .filter((w) => w.wageType === "hourly")
      .flatMap((w) => {
        const byDay = w.dailyRateMode === "daily";
        return logs
          .filter((l) => l.workerId === w.id && l.date >= start && l.date <= end)
          .filter((l) => (byDay ? l.dayAmount != null : l.hours > 0))
          .map((l) => {
            const amount = byDay ? (l.dayAmount ?? 0) : l.hours * w.wageRate;
            return {
              date: l.date, worker: w, byDay, hours: l.hours, dayAmount: l.dayAmount,
              amount, amountKhr: toKhr(amount, w.wageCurrency, rate), paid: !!l.paymentId,
            };
          });
      });
    rows.sort((a, b) => a.date.localeCompare(b.date) || a.worker.name.localeCompare(b.worker.name, "km"));
    return rows;
  }, [workers, logs, start, end, rate]);

  const dailySummary = useMemo(() => {
    const byWorker = new Map<string, { worker: (typeof dailyLedger)[number]["worker"]; amountKhr: number; days: number }>();
    for (const r of dailyLedger) {
      const cur = byWorker.get(r.worker.id) ?? { worker: r.worker, amountKhr: 0, days: 0 };
      cur.amountKhr += r.amountKhr; cur.days += 1;
      byWorker.set(r.worker.id, cur);
    }
    return Array.from(byWorker.values());
  }, [dailyLedger]);

  /* Salaried workers for the chosen cycle */
  const salaryRows = useMemo(() => workers
    .filter((w) => w.wageType === "monthly")
    .map((w) => {
      const frac = cycleWorkedFraction(cycle, w.startDate);
      const amount = w.wageRate * frac;
      const paid = payments.some((p) => p.workerId === w.id && p.wageType === "monthly" && p.cycleStart === cycle.start);
      return { w, frac, amount, amountKhr: toKhr(amount, w.wageCurrency, rate), paid };
    })
    .filter((r) => r.amount > 0), [workers, payments, cycle, rate]);


  const dailyTotal = dailyLedger.reduce((s, r) => s + r.amountKhr, 0);
  const salaryTotal = salaryRows.reduce((s, r) => s + r.amountKhr, 0);

  const exportCSV = () => {
    if (mode === "daily") {
      downloadCSV(`payroll-daily-${start}_${end}.csv`, [
        ["ថ្ងៃ", "ឈ្មោះ", "ភេទ", "របៀបគិត", "ម៉ោង/ចំនួនប្រាក់ថ្ងៃនោះ", "ចំនួនទឹកប្រាក់", "សរុប (៛)", "ស្ថានភាព"],
        ...dailyLedger.map((r) => [
          r.date, r.worker.name, r.worker.gender ?? "", r.byDay ? "ថេរប្រែប្រួល/ថ្ងៃ" : "តាមម៉ោង",
          r.byDay ? fmtCurrency(r.dayAmount ?? 0, r.worker.wageCurrency) : `${r.hours} ម៉ោង`,
          r.amount, Math.round(r.amountKhr), r.paid ? "បើករួច" : "មិនទាន់បើក",
        ]),
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "សរុប", Math.round(dailyTotal), ""],
      ]);
    } else {
      downloadCSV(`payroll-salary-${cycle.start}_${cycle.end}.csv`, [
        ["ឈ្មោះ", "ភេទ", "ប្រាក់ខែ", "រូបិយប័ណ្ណ", "សមាមាត្រខួប", "ចំនួនត្រូវបង់", "សរុប (៛)", "ស្ថានភាព"],
        ...salaryRows.map((r) => [
          r.w.name, r.w.gender ?? "", r.w.wageRate, r.w.wageCurrency,
          `${Math.round(r.frac * 100)}%`, r.amount, Math.round(r.amountKhr), r.paid ? "បើករួច" : "មិនទាន់បើក",
        ]),
        ["", "", "", "", "", "សរុប", Math.round(salaryTotal), ""],
      ]);
    }
  };

  const th = { border: `1px solid ${C.line}`, background: C.bgAlt } as const;
  const td = { border: `1px solid ${C.line}` } as const;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: C.bg }}>
      <div className="no-print sticky top-0 px-4 lg:px-8 py-3" style={{ background: C.card, borderBottom: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-medium" style={{ color: C.greenMid }}><ArrowLeft size={15} /> ត្រឡប់ក្រោយ</button>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ background: C.bgAlt, color: C.green }}><Download size={13} /> CSV</button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: C.green, color: "#fff" }}><Printer size={13} /> បោះពុម្ព</button>
          </div>
        </div>

        <div className="flex rounded-xl p-1 mb-3" style={{ background: C.bgAlt }}>
          <button onClick={() => setMode("daily")} className="flex-1 rounded-lg py-2 text-[11px] font-semibold" style={{ background: mode === "daily" ? C.card : "transparent", color: mode === "daily" ? C.green : C.inkSoft }}>ប្រាក់ថ្ងៃ (តាមថ្ងៃ)</button>
          <button onClick={() => setMode("salary")} className="flex-1 rounded-lg py-2 text-[11px] font-semibold" style={{ background: mode === "salary" ? C.card : "transparent", color: mode === "salary" ? C.green : C.inkSoft }}>ប្រាក់ខែ (តាមខួប)</button>
        </div>

        {mode === "daily" ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10.5px] mb-1" style={{ color: C.inkSoft }}>ពីថ្ងៃ</div>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <div className="text-[10.5px] mb-1" style={{ color: C.inkSoft }}>ដល់ថ្ងៃ</div>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} style={inputStyle} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl px-2 py-2" style={{ background: C.bgAlt }}>
            <button onClick={() => setCycleRef(new Date(shiftCycle(cycle, farm?.payrollCycleStartDay ?? 1, -1).start))} className="px-3 py-1 text-xs font-semibold" style={{ color: C.green }}>← មុន</button>
            <div className="text-xs font-semibold" style={{ color: C.green }}>{cycle.label}</div>
            <button onClick={() => setCycleRef(new Date(shiftCycle(cycle, farm?.payrollCycleStartDay ?? 1, 1).start))} className="px-3 py-1 text-xs font-semibold" style={{ color: C.green }}>បន្ទាប់ →</button>
          </div>
        )}
      </div>

      <div className="print-area p-5 lg:p-8 max-w-3xl mx-auto">
        <h1 className="text-lg font-bold mb-1" style={{ color: C.green }}>{farm?.farmName} — តារាងចំណាយប្រាក់ឈ្នួល</h1>
        <div className="text-[11px] mb-1" style={{ color: C.inkSoft }}>
          {mode === "daily" ? `ប្រាក់ថ្ងៃ · ${fmtDate(start)} – ${fmtDate(end)}` : `ប្រាក់ខែ · ${cycle.label}`}
        </div>
        <div className="text-[11px] mb-4" style={{ color: C.inkSoft }}>ចេញកាលបរិច្ឆេទ {fmtDate(todayISO())}</div>

        {mode === "daily" ? (
          dailyLedger.length === 0 ? (
            <div className="text-xs" style={{ color: C.inkSoft }}>គ្មានទិន្នន័យក្នុងចន្លោះថ្ងៃនេះទេ</div>
          ) : (
            <>
              <table className="w-full text-[11px] mb-5" style={{ borderCollapse: "collapse" }}>
                <thead><tr>{["ថ្ងៃ", "ឈ្មោះ", "របៀបគិត", "ម៉ោង/ថ្ងៃនោះ", "ចំនួនទឹកប្រាក់", "ស្ថានភាព"].map((h) => <th key={h} className="text-left p-1.5" style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {dailyLedger.map((r, i) => (
                    <tr key={i}>
                      <td className="p-1.5" style={td}>{fmtDate(r.date)}</td>
                      <td className="p-1.5" style={td}>{r.worker.name}</td>
                      <td className="p-1.5" style={td}>{r.byDay ? "ថេរប្រែប្រួល/ថ្ងៃ" : "តាមម៉ោង"}</td>
                      <td className="p-1.5" style={td}>{r.byDay ? fmtCurrency(r.dayAmount ?? 0, r.worker.wageCurrency) : `${r.hours} ម៉ោង`}</td>
                      <td className="p-1.5" style={td}>{fmtCurrency(r.amount, r.worker.wageCurrency)}{r.worker.wageCurrency === "USD" ? ` (≈${fmtCurrency(r.amountKhr, "KHR")})` : ""}</td>
                      <td className="p-1.5" style={td}>{r.paid ? "បើករួច" : "មិនទាន់បើក"}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="p-1.5 font-semibold" style={{ ...td, background: C.bgAlt }} colSpan={4}>សរុប</td>
                    <td className="p-1.5 font-semibold" style={{ ...td, background: C.bgAlt }} colSpan={2}>{fmtCurrency(dailyTotal, "KHR")}</td>
                  </tr>
                </tbody>
              </table>

              <h2 className="text-sm font-bold mb-2" style={{ color: C.green }}>សង្ខេបតាមកម្មករ</h2>
              <table className="w-full text-[11px]" style={{ borderCollapse: "collapse" }}>
                <thead><tr>{["ឈ្មោះ", "ចំនួនថ្ងៃ", "សរុប (៛)"].map((h) => <th key={h} className="text-left p-1.5" style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {dailySummary.map((r) => (
                    <tr key={r.worker.id}>
                      <td className="p-1.5" style={td}>{r.worker.name}</td>
                      <td className="p-1.5" style={td}>{r.days}</td>
                      <td className="p-1.5" style={td}>{fmtCurrency(r.amountKhr, "KHR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )
        ) : (
          salaryRows.length === 0 ? (
            <div className="text-xs" style={{ color: C.inkSoft }}>គ្មានកម្មករប្រាក់ខែក្នុងខួបនេះទេ</div>
          ) : (
            <table className="w-full text-[11px]" style={{ borderCollapse: "collapse" }}>
              <thead><tr>{["ឈ្មោះ", "ប្រាក់ខែ", "សមាមាត្រ", "ចំនួនត្រូវបង់", "ស្ថានភាព"].map((h) => <th key={h} className="text-left p-1.5" style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {salaryRows.map((r) => (
                  <tr key={r.w.id}>
                    <td className="p-1.5" style={td}>{r.w.name}</td>
                    <td className="p-1.5" style={td}>{fmtCurrency(r.w.wageRate, r.w.wageCurrency)}</td>
                    <td className="p-1.5" style={td}>{Math.round(r.frac * 100)}%</td>
                    <td className="p-1.5" style={td}>{fmtCurrency(r.amount, r.w.wageCurrency)}{r.w.wageCurrency === "USD" ? ` (≈${fmtCurrency(r.amountKhr, "KHR")})` : ""}</td>
                    <td className="p-1.5" style={td}>{r.paid ? "បើករួច" : "មិនទាន់បើក"}</td>
                  </tr>
                ))}
                <tr>
                  <td className="p-1.5 font-semibold" style={{ ...td, background: C.bgAlt }} colSpan={3}>សរុប</td>
                  <td className="p-1.5 font-semibold" style={{ ...td, background: C.bgAlt }} colSpan={2}>{fmtCurrency(salaryTotal, "KHR")}</td>
                </tr>
              </tbody>
            </table>
          )
        )}

        <div className="grid grid-cols-2 gap-8 mt-10 text-[11px]" style={{ color: C.inkSoft }}>
          <div>
            <div className="mb-10">អ្នករៀបចំ</div>
            <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 4 }}>ហត្ថលេខា និងឈ្មោះ</div>
          </div>
          <div>
            <div className="mb-10">អ្នកអនុម័ត</div>
            <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 4 }}>ហត្ថលេខា និងឈ្មោះ</div>
          </div>
        </div>
      </div>
    </div>
  );
}
