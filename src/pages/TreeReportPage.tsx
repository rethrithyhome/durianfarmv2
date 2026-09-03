import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmSettings } from "@/hooks/useFarmSettings";
import { useTrees } from "@/hooks/useTrees";
import { HEALTH_LEVELS, healthInfo } from "@/lib/constants";
import { fmtDate, todayISO } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import { C } from "@/lib/tokens";
import { FilterChip } from "@/components/ui/primitives";
import type { Health } from "@/types/domain";

export function TreeReportPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const enabled = !!profile?.farmId;
  const farmQ = useFarmSettings(enabled);
  const treesQ = useTrees(enabled);

  const farm = farmQ.data;
  const [plotFilter, setPlotFilter] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<Health | "all">("all");

  const allPlots = useMemo(
    () => Array.from(new Set((treesQ.data ?? []).map((t) => t.plot).filter((p): p is string => !!p))).sort(),
    [treesQ.data]
  );

  const rows = useMemo(() => {
    let list = treesQ.data ?? [];
    if (plotFilter !== "all") list = list.filter((t) => t.plot === plotFilter);
    if (healthFilter !== "all") list = list.filter((t) => t.health === healthFilter);
    return [...list].sort((a, b) => a.code.localeCompare(b.code, "km"));
  }, [treesQ.data, plotFilter, healthFilter]);

  const exportCSV = () => {
    downloadCSV(`trees-${todayISO()}.csv`, [
      ["លេខកូដ", "ចម្រៀក/តំបន់", "ពូជ", "ថ្ងៃដាំ", "សុខភាព", "កំណត់ចំណាំ"],
      ...rows.map((t) => [t.code, t.plot ?? "", t.variety ?? "", t.plantedDate ? fmtDate(t.plantedDate) : "", healthInfo(t.health).label, t.notes ?? ""]),
    ]);
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
        {allPlots.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto mb-2 pb-0.5">
            <FilterChip active={plotFilter === "all"} onClick={() => setPlotFilter("all")} label="ចម្រៀកទាំងអស់" />
            {allPlots.map((p) => <FilterChip key={p} active={plotFilter === p} onClick={() => setPlotFilter(p)} label={p} />)}
          </div>
        )}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          <FilterChip active={healthFilter === "all"} onClick={() => setHealthFilter("all")} label="សុខភាពទាំងអស់" />
          {HEALTH_LEVELS.map((h) => <FilterChip key={h.key} active={healthFilter === h.key} onClick={() => setHealthFilter(h.key)} label={h.label} color={h.color} />)}
        </div>
      </div>

      <div className="print-area p-5 lg:p-8 max-w-4xl mx-auto">
        <h1 className="text-lg font-bold mb-1" style={{ color: C.green }}>{farm?.farmName} — បញ្ជីដើមទុរេន</h1>
        <div className="text-[11px] mb-4" style={{ color: C.inkSoft }}>ចេញកាលបរិច្ឆេទ {fmtDate(todayISO())} · {rows.length} ដើម</div>

        {rows.length === 0 ? (
          <div className="text-xs" style={{ color: C.inkSoft }}>គ្មានទិន្នន័យទេ</div>
        ) : (
          <table className="w-full text-[10.5px]" style={{ borderCollapse: "collapse" }}>
            <thead><tr>{["លេខកូដ", "ចម្រៀក", "ពូជ", "ថ្ងៃដាំ", "សុខភាព", "កំណត់ចំណាំ"].map((h) => <th key={h} className="text-left p-1.5" style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="p-1.5" style={td}>{t.code}</td>
                  <td className="p-1.5" style={td}>{t.plot ?? ""}</td>
                  <td className="p-1.5" style={td}>{t.variety ?? ""}</td>
                  <td className="p-1.5" style={td}>{t.plantedDate ? fmtDate(t.plantedDate) : ""}</td>
                  <td className="p-1.5" style={td}>{healthInfo(t.health).label}</td>
                  <td className="p-1.5" style={td}>{t.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
