import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import { fmtCurrency } from "@/lib/currency";
import { C } from "@/lib/tokens";
import type { Expense, Sale, YieldEvent } from "@/types/domain";

const MONTHS_SHORT = ["ម.ក", "ក.ម", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];

function monthlyTotals(dates: string[], values: number[], year: number): number[] {
  const out = Array(12).fill(0);
  dates.forEach((d, i) => {
    const dt = new Date(d);
    if (dt.getFullYear() === year) out[dt.getMonth()] += values[i];
  });
  return out;
}

type Metric = "yield" | "revenue" | "expense";

export function YearlyComparisonChart({
  events, sales, expenses, showYield, showMoney, thisYear,
}: {
  events: YieldEvent[];
  sales: Sale[];
  expenses: Expense[];
  showYield: boolean;
  showMoney: boolean;
  thisYear: number;
}) {
  const [metric, setMetric] = useState<Metric>(showYield ? "yield" : "revenue");
  const lastYear = thisYear - 1;

  const data = useMemo(() => {
    let dates: string[]; let values: number[]; let unit: "count" | "khr";
    if (metric === "yield") {
      const harvested = events.filter((e) => e.type === "harvested");
      dates = harvested.map((e) => e.date); values = harvested.map((e) => e.quantity); unit = "count";
    } else if (metric === "revenue") {
      dates = sales.map((s) => s.date); values = sales.map((s) => s.totalRevenueKhr); unit = "khr";
    } else {
      dates = expenses.map((e) => e.date); values = expenses.map((e) => e.amountKhr); unit = "khr";
    }
    const cur = monthlyTotals(dates, values, thisYear);
    const prev = monthlyTotals(dates, values, lastYear);
    return {
      unit,
      rows: MONTHS_SHORT.map((m, i) => ({ month: m, [`ឆ្នាំ ${lastYear}`]: Math.round(prev[i]), [`ឆ្នាំ ${thisYear}`]: Math.round(cur[i]) })),
    };
  }, [metric, events, sales, expenses, thisYear, lastYear]);

  const tabs: { key: Metric; label: string; show: boolean }[] = [
    { key: "yield", label: "ទិន្នផល", show: showYield },
    { key: "revenue", label: "ចំណូល", show: showMoney },
    { key: "expense", label: "ចំណាយ", show: showMoney },
  ];
  const visibleTabs = tabs.filter((t) => t.show);
  if (visibleTabs.length === 0) return null;

  return (
    <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-1.5 mb-3">
        <BarChart3 size={15} color={C.green} />
        <span className="text-sm font-semibold" style={{ color: C.green }}>ប្រៀបធៀបប្រចាំឆ្នាំ</span>
      </div>

      {visibleTabs.length > 1 && (
        <div className="flex rounded-xl p-1 mb-3" style={{ background: C.bgAlt }}>
          {visibleTabs.map((t) => (
            <button key={t.key} onClick={() => setMetric(t.key)} className="flex-1 rounded-lg py-1.5 text-[11px] font-semibold" style={{ background: metric === t.key ? C.card : "transparent", color: metric === t.key ? C.green : C.inkSoft }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <div style={{ minWidth: 480, height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.rows} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: C.inkSoft }} axisLine={{ stroke: C.line }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: C.inkSoft }} axisLine={false} tickLine={false} width={44}
                tickFormatter={(v: number) => (data.unit === "khr" ? (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`) : String(v))} />
              <Tooltip
                contentStyle={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 11 }}
                formatter={(v) => (data.unit === "khr" ? fmtCurrency(Number(v), "KHR") : `${v} ផ្លែ`)}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey={`ឆ្នាំ ${lastYear}`} fill={C.line} radius={[4, 4, 0, 0]} />
              <Bar dataKey={`ឆ្នាំ ${thisYear}`} fill={C.greenMid} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
