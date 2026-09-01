import { AlertTriangle, TreePine, Package, TrendingDown, TrendingUp, DollarSign, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTrees } from "@/hooks/useTrees";
import { useWorkers } from "@/hooks/useWorkers";
import { useEvents, useCareLogs } from "@/hooks/useYield";
import { useExpenses } from "@/hooks/useExpenses";
import { useSales, useLocations } from "@/hooks/useSales";
import { can } from "@/lib/permissions";
import { healthInfo, careInfo } from "@/lib/constants";
import { fmtDate, thisYear } from "@/lib/format";
import { fmtCurrency } from "@/lib/currency";
import { C, tint } from "@/lib/tokens";
import { StatCard, Badge } from "@/components/ui/primitives";
import type { Role } from "@/types/domain";

export function HomePage({ role }: { role: Role }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const enabled = !!profile?.farmId;
  const showFarm = can(role, "farm");
  const showSales = can(role, "sales");

  const treesQ = useTrees(enabled && showFarm);
  const workersQ = useWorkers(enabled && showFarm);
  const eventsQ = useEvents(enabled && showFarm);
  const careQ = useCareLogs(enabled && showFarm);
  const expensesQ = useExpenses(enabled && (showFarm || showSales));
  const salesQ = useSales(enabled && showSales);
  const locationsQ = useLocations(enabled && showSales);

  const trees = treesQ.data ?? [];
  const workers = workersQ.data ?? [];
  const events = eventsQ.data ?? [];
  const careLogs = careQ.data ?? [];
  const expenses = expensesQ.data ?? [];
  const sales = salesQ.data ?? [];
  const locations = locationsQ.data ?? [];

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

  return (
    <div className="pt-1 pb-4 space-y-4">
      {showFarm && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={TreePine} label="ដើមទុរេនសរុប" value={trees.length} sub={`កម្មករ ${workers.length} នាក់`} />
          <StatCard icon={AlertTriangle} label="ត្រូវការការយកចិត្តទុកដាក់" value={needsAttention.length} accent={needsAttention.length ? C.red : C.green} sub="ដើមមានបញ្ហា" />
          <StatCard icon={Package} label={`បេះផ្លែស្អាតឆ្នាំ ${thisYear}`} value={totals.harvested} accent={C.greenMid} sub={`ទម្ងន់ ${totalWeight.toFixed(0)} kg`} />
          <StatCard icon={TrendingDown} label="បាត់បង់ (ជ្រុះ+ខូច)" value={totals.fallen + totals.rotten + totals.ripeFallen} accent={C.goldDeep} sub="ផ្លែ" />
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
          <StatCard icon={Store} label="ទីតាំងលក់" value={locations.length} />
          <StatCard icon={TrendingUp} label={`ចំណូលឆ្នាំ ${thisYear}`} value={fmtCurrency(yearRevenue, "KHR")} accent={C.greenMid} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
      </div>
    </div>
  );
}
