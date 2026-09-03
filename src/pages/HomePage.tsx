import { useMemo } from "react";
import { AlertTriangle, TreePine, Package, TrendingDown, TrendingUp, DollarSign, Store, ClipboardList, Wallet, Receipt, History, Plus, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTrees } from "@/hooks/useTrees";
import { useWorkers } from "@/hooks/useWorkers";
import { useEvents, useCareLogs } from "@/hooks/useYield";
import { useExpenses } from "@/hooks/useExpenses";
import { useSales, useLocations } from "@/hooks/useSales";
import { useTasks } from "@/hooks/useTasks";
import { useWorkLogs, usePayrollPayments } from "@/hooks/usePayroll";
import { useFarmSettings } from "@/hooks/useFarmSettings";
import { useAuditLogs } from "@/hooks/useAudit";
import { AUDIT_TABLE_LABELS, AUDIT_ACTION_LABELS, type AuditAction } from "@/api/audit";
import { can } from "@/lib/permissions";
import { healthInfo, careInfo } from "@/lib/constants";
import { fmtDate, thisYear, todayISO } from "@/lib/format";
import { fmtCurrency, toKhr } from "@/lib/currency";
import { cycleFor, cycleWorkedFraction } from "@/lib/payroll";
import { C, tint } from "@/lib/tokens";
import { StatCard, Badge } from "@/components/ui/primitives";
import { YearlyComparisonChart } from "@/components/home/YearlyComparisonChart";
import type { Role } from "@/types/domain";

const AUDIT_ACTION_ICON: Record<AuditAction, typeof Plus> = { INSERT: Plus, UPDATE: Pencil, DELETE: Trash2 };
const AUDIT_ACTION_COLOR: Record<AuditAction, string> = { INSERT: "#3D6B4F", UPDATE: "#B9832C", DELETE: "#B54B3A" };

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "ទើបតែឥឡូវ";
  if (mins < 60) return `${mins} នាទីមុន`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ម៉ោងមុន`;
  return `${Math.floor(hrs / 24)} ថ្ងៃមុន`;
}

export function HomePage({ role }: { role: Role }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const enabled = !!profile?.farmId;
  const showFarm = can(role, "farm");
  const showSales = can(role, "sales");
  const showTasks = can(role, "tasks");
  const showPayroll = can(role, "payWages");
  const showDebt = can(role, "addExpense") || can(role, "viewReports");
  const showActivity = can(role, "viewUsers");

  const farmQ = useFarmSettings(enabled && (showPayroll));
  const treesQ = useTrees(enabled && showFarm);
  const workersQ = useWorkers(enabled && (showFarm || showPayroll));
  const eventsQ = useEvents(enabled && showFarm);
  const careQ = useCareLogs(enabled && showFarm);
  const expensesQ = useExpenses(enabled && (showFarm || showSales || showDebt));
  const salesQ = useSales(enabled && showSales);
  const locationsQ = useLocations(enabled && showSales);
  const tasksQ = useTasks(enabled && showTasks);
  const workLogsQ = useWorkLogs(enabled && showPayroll);
  const paymentsQ = usePayrollPayments(enabled && showPayroll);
  const auditQ = useAuditLogs(enabled && showActivity);

  const trees = treesQ.data ?? [];
  const workers = workersQ.data ?? [];
  const events = eventsQ.data ?? [];
  const careLogs = careQ.data ?? [];
  const expenses = expensesQ.data ?? [];
  const sales = salesQ.data ?? [];
  const locations = locationsQ.data ?? [];
  const tasks = tasksQ.data ?? [];
  const workLogs = workLogsQ.data ?? [];
  const payments = paymentsQ.data ?? [];
  const auditLogs = auditQ.data ?? [];

  const needsAttention = trees.filter((t) => t.health === "needs_care" || t.health === "sick");
  const yearEvents = events.filter((e) => new Date(e.date).getFullYear() === thisYear);
  const totals = yearEvents.reduce(
    (a, e) => {
      if (e.type === "harvested") a.harvested += e.quantity;
      else if (e.type === "fallen") a.fallen += e.quantity;
      else if (e.type === "rotten") a.rotten += e.quantity;
      else if (e.type === "ripeFallen") a.ripeFallen += e.quantity;
      return a;
    },
    { harvested: 0, fallen: 0, rotten: 0, ripeFallen: 0 }
  );
  const totalWeight = yearEvents.filter((e) => e.type === "harvested").reduce((s, e) => s + (e.weightKg || 0), 0);
  const yearExpenses = expenses.filter((e) => new Date(e.date).getFullYear() === thisYear).reduce((s, e) => s + e.amountKhr, 0);
  const yearRevenue = sales.filter((s) => new Date(s.date).getFullYear() === thisYear).reduce((s, r) => s + r.totalRevenueKhr, 0);
  const netProfit = yearRevenue - yearExpenses;

  const myOpenTasks = useMemo(
    () => tasks.filter((t) => t.status === "open" && (!t.assigneeId || t.assigneeId === profile?.id))
      .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")),
    [tasks, profile?.id]
  );
  const overdueCount = myOpenTasks.filter((t) => t.dueDate && t.dueDate < todayISO()).length;

  const unpaidDebtKhr = useMemo(() => expenses.filter((e) => !e.paid).reduce((s, e) => s + e.amountKhr, 0), [expenses]);

  const payrollDueKhr = useMemo(() => {
    if (!farmQ.data) return 0;
    const rate = farmQ.data.exchangeRate;
    let total = 0;
    for (const w of workers) {
      if (w.status !== "active") continue;
      if (w.wageType === "hourly") {
        const unpaid = workLogs.filter((l) => l.workerId === w.id && !l.paymentId);
        const byDay = w.dailyRateMode === "daily";
        const amount = byDay
          ? unpaid.reduce((s, l) => s + (l.dayAmount ?? 0), 0)
          : unpaid.reduce((s, l) => s + l.hours, 0) * w.wageRate;
        total += toKhr(amount, w.wageCurrency, rate);
      } else {
        const cycle = cycleFor(new Date(), farmQ.data.payrollCycleStartDay);
        const alreadyPaid = payments.some((p) => p.workerId === w.id && p.wageType === "monthly" && p.cycleStart === cycle.start);
        if (!alreadyPaid) {
          const amount = w.wageRate * cycleWorkedFraction(cycle, w.startDate);
          total += toKhr(amount, w.wageCurrency, rate);
        }
      }
    }
    return total;
  }, [workers, workLogs, payments, farmQ.data]);

  const recentActivity = useMemo(() => [...auditLogs].slice(0, 5), [auditLogs]);

  return (
    <div className="pt-1 pb-4 space-y-4">
      {showFarm && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={TreePine} label="ដើមទុរេនសរុប" value={trees.length} sub={`កម្មករ ${workers.length} នាក់`} onClick={() => navigate("/trees")} />
          <StatCard icon={AlertTriangle} label="ត្រូវការការយកចិត្តទុកដាក់" value={needsAttention.length} accent={needsAttention.length ? C.red : C.green} sub="ដើមមានបញ្ហា" onClick={() => navigate("/trees")} />
          <StatCard icon={Package} label={`បេះផ្លែស្អាតឆ្នាំ ${thisYear}`} value={totals.harvested} accent={C.greenMid} sub={`ទម្ងន់ ${totalWeight.toFixed(0)} kg`} />
          <StatCard icon={TrendingDown} label="បាត់បង់ (ជ្រុះ+ខូច)" value={totals.fallen + totals.rotten + totals.ripeFallen} accent={C.goldDeep} sub="ផ្លែ" />
        </div>
      )}

      {/* Live operational widgets — tasks, payroll owed, and debt, so Home
          reflects what actually needs attention right now, not just
          year-to-date farm stats. */}
      {(showTasks || showPayroll || showDebt) && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {showTasks && (
            <StatCard icon={ClipboardList} label="ការងាររបស់ខ្ញុំ" value={myOpenTasks.length} accent={overdueCount > 0 ? C.red : C.blue} sub={overdueCount > 0 ? `${overdueCount} ហួសកំណត់` : "កំពុងរង់ចាំ"} onClick={() => navigate("/tasks")} />
          )}
          {showPayroll && (
            <StatCard icon={Wallet} label="ប្រាក់ឈ្នួលត្រូវបង់" value={fmtCurrency(payrollDueKhr, "KHR")} accent={payrollDueKhr > 0 ? C.goldDeep : C.greenMid} onClick={() => navigate("/payroll")} />
          )}
          {showDebt && (
            <StatCard icon={Receipt} label="ចំណាយជំពាក់" value={fmtCurrency(unpaidDebtKhr, "KHR")} accent={unpaidDebtKhr > 0 ? C.red : C.greenMid} onClick={() => navigate("/expenses")} />
          )}
        </div>
      )}

      {can(role, "farm") && can(role, "sales") && (
        <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-sm font-semibold mb-3" style={{ color: C.green }}>សង្ខេបហិរញ្ញវត្ថុ ឆ្នាំ {thisYear}</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl py-2.5" style={{ background: tint(C.greenMid, 12) }}><TrendingUp size={14} color={C.greenMid} className="mx-auto mb-1" /><div className="text-sm font-bold" style={{ color: C.greenMid }}>{fmtCurrency(yearRevenue, "KHR")}</div><div className="text-[10px]" style={{ color: C.inkSoft }}>ចំណូល</div></div>
            <div className="rounded-xl py-2.5" style={{ background: tint(C.red, 12) }}><TrendingDown size={14} color={C.red} className="mx-auto mb-1" /><div className="text-sm font-bold" style={{ color: C.red }}>{fmtCurrency(yearExpenses, "KHR")}</div><div className="text-[10px]" style={{ color: C.inkSoft }}>ចំណាយ</div></div>
            <div className="rounded-xl py-2.5" style={{ background: tint(C.gold, 22) }}><DollarSign size={14} color={C.goldDeep} className="mx-auto mb-1" /><div className="text-sm font-bold" style={{ color: netProfit >= 0 ? C.greenMid : C.red }}>{fmtCurrency(netProfit, "KHR")}</div><div className="text-[10px]" style={{ color: C.inkSoft }}>ចំណេញសុទ្ធ</div></div>
          </div>
        </div>
      )}

      {showSales && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Store} label="ទីតាំងលក់" value={locations.length} onClick={() => navigate("/sales")} />
          <StatCard icon={TrendingUp} label={`ចំណូលឆ្នាំ ${thisYear}`} value={fmtCurrency(yearRevenue, "KHR")} accent={C.greenMid} onClick={() => navigate("/sales")} />
        </div>
      )}

      {(showFarm || showSales) && (
        <YearlyComparisonChart events={events} sales={sales} expenses={expenses} showYield={showFarm} showMoney={can(role, "farm") && showSales} thisYear={thisYear} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {showTasks && myOpenTasks.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5"><ClipboardList size={15} color={C.blue} /><span className="text-sm font-semibold" style={{ color: C.green }}>ការងារជិតដល់កំណត់</span></div>
              <button onClick={() => navigate("/tasks")} className="text-[11px] font-semibold" style={{ color: C.greenMid }}>មើលទាំងអស់</button>
            </div>
            <div className="space-y-1.5">
              {myOpenTasks.slice(0, 4).map((t) => {
                const late = t.dueDate && t.dueDate < todayISO();
                return (
                  <button key={t.id} onClick={() => navigate("/tasks")} className="w-full flex items-center justify-between text-xs py-1">
                    <span className="truncate flex-1 text-left" style={{ color: C.ink }}>{t.title}</span>
                    {t.dueDate && <Badge label={late ? "ហួសកំណត់" : fmtDate(t.dueDate)} color={late ? C.red : C.inkSoft} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showFarm && needsAttention.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: tint(C.red, 8), border: `1px solid ${tint(C.red, 20)}` }}>
            <div className="flex items-center gap-2 mb-2"><AlertTriangle size={16} color={C.red} /><span className="text-sm font-semibold" style={{ color: C.red }}>ដើមត្រូវការការថែទាំបន្ទាន់</span></div>
            <div className="space-y-1.5">
              {needsAttention.slice(0, 4).map((t) => (
                <button key={t.id} onClick={() => navigate(`/trees/${t.id}`)} className="w-full flex items-center justify-between text-xs py-1">
                  <span style={{ color: C.ink }}>{t.code} · {t.plot || "គ្មានចម្រៀក"}</span>
                  <Badge label={healthInfo(t.health).label} color={healthInfo(t.health).color} />
                </button>
              ))}
            </div>
          </div>
        )}

        {showFarm && careLogs.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="text-sm font-semibold mb-3" style={{ color: C.green }}>សកម្មភាពថែទាំថ្មីៗ</div>
            <div className="space-y-2.5">
              {[...careLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4).map((c) => {
                const ci = careInfo(c.type); const Icon = ci.icon;
                const t = trees.find((tt) => tt.id === c.treeId);
                return (
                  <div key={c.id} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: tint(ci.color, 10) }}><Icon size={14} color={ci.color} /></div>
                    <div className="flex-1 min-w-0"><div className="text-xs font-medium truncate" style={{ color: C.ink }}>{ci.label} · {t ? t.code : "ដើមទាំងអស់"}</div><div className="text-[10.5px]" style={{ color: C.inkSoft }}>{fmtDate(c.date)}</div></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showActivity && recentActivity.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5"><History size={15} color={C.green} /><span className="text-sm font-semibold" style={{ color: C.green }}>សកម្មភាពថ្មីៗក្នុងចម្ការ</span></div>
              <button onClick={() => navigate("/audit")} className="text-[11px] font-semibold" style={{ color: C.greenMid }}>មើលទាំងអស់</button>
            </div>
            <div className="space-y-2.5">
              {recentActivity.map((l) => {
                const Icon = AUDIT_ACTION_ICON[l.action];
                const color = AUDIT_ACTION_COLOR[l.action];
                return (
                  <div key={l.id} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: tint(color, 10) }}><Icon size={13} color={color} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: C.ink }}>
                        {AUDIT_ACTION_LABELS[l.action]} {AUDIT_TABLE_LABELS[l.tableName] ?? l.tableName}{l.summary ? ` · ${l.summary}` : ""}
                      </div>
                      <div className="text-[10.5px]" style={{ color: C.inkSoft }}>{l.actorName ?? "—"} · {relativeTime(l.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
