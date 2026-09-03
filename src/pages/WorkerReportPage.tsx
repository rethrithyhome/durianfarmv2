import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmSettings } from "@/hooks/useFarmSettings";
import { useWorkers } from "@/hooks/useWorkers";
import { GENDER_LABELS } from "@/lib/constants";
import { fmtCurrency } from "@/lib/currency";
import { fmtDate, todayISO } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import { C } from "@/lib/tokens";
import { FilterChip } from "@/components/ui/primitives";
import type { Status, WageType } from "@/types/domain";

export function WorkerReportPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const enabled = !!profile?.farmId;
  const farmQ = useFarmSettings(enabled);
  const workersQ = useWorkers(enabled);

  const farm = farmQ.data;
  const [statusFilter, setStatusFilter] = useState<Status | "all">("active");
  const [wageFilter, setWageFilter] = useState<WageType | "all">("all");

  const rows = useMemo(() => {
    let list = workersQ.data ?? [];
    if (statusFilter !== "all") list = list.filter((w) => w.status === statusFilter);
    if (wageFilter !== "all") list = list.filter((w) => w.wageType === wageFilter);
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "km"));
  }, [workersQ.data, statusFilter, wageFilter]);

  const exportCSV = () => {
    downloadCSV(`workers-${todayISO()}.csv`, [
      ["ឈ្មោះ", "ភេទ", "លេខទូរស័ព្ទ", "ថ្ងៃខែឆ្នាំកំណើត", "តួនាទី", "ចម្រៀក/តំបន់", "ប្រភេទប្រាក់ឈ្នួល", "អត្រា", "ថ្ងៃចូលធ្វើការ", "ស្ថានភាព"],
      ...rows.map((w) => [
        w.name, w.gender ? GENDER_LABELS[w.gender] : "", w.phone ?? "", w.birthDate ? fmtDate(w.birthDate) : "",
        w.position ?? "", w.plot ?? "",
        w.wageType === "monthly" ? "ប្រាក់ខែ" : "ប្រាក់ថ្ងៃ",
        w.wageType === "monthly" || w.dailyRateMode === "hourly" ? fmtCurrency(w.wageRate, w.wageCurrency) : "ប្រែប្រួល",
        w.startDate ? fmtDate(w.startDate) : "", w.status === "active" ? "កំពុងធ្វើការ" : "ឈប់ធ្វើការ",
      ]),
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
        <div className="flex gap-1.5 overflow-x-auto mb-2 pb-0.5">
          <FilterChip active={statusFilter === "active"} onClick={() => setStatusFilter("active")} label="កំពុងធ្វើការ" color={C.greenMid} />
          <FilterChip active={statusFilter === "inactive"} onClick={() => setStatusFilter("inactive")} label="ឈប់ធ្វើការ" color={C.red} />
          <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")} label="ទាំងអស់" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          <FilterChip active={wageFilter === "all"} onClick={() => setWageFilter("all")} label="ប្រភេទទាំងអស់" />
          <FilterChip active={wageFilter === "monthly"} onClick={() => setWageFilter("monthly")} label="ប្រាក់ខែ" color={C.greenMid} />
          <FilterChip active={wageFilter === "hourly"} onClick={() => setWageFilter("hourly")} label="ប្រាក់ថ្ងៃ" color={C.blue} />
        </div>
      </div>

      <div className="print-area p-5 lg:p-8 max-w-4xl mx-auto">
        <h1 className="text-lg font-bold mb-1" style={{ color: C.green }}>{farm?.farmName} — បញ្ជីកម្មករ</h1>
        <div className="text-[11px] mb-4" style={{ color: C.inkSoft }}>ចេញកាលបរិច្ឆេទ {fmtDate(todayISO())} · {rows.length} នាក់</div>

        {rows.length === 0 ? (
          <div className="text-xs" style={{ color: C.inkSoft }}>គ្មានទិន្នន័យទេ</div>
        ) : (
          <table className="w-full text-[10.5px]" style={{ borderCollapse: "collapse" }}>
            <thead><tr>{["ឈ្មោះ", "ភេទ", "លេខទូរស័ព្ទ", "កំណើត", "តួនាទី", "ចម្រៀក", "ប្រភេទ", "អត្រា", "ចូលធ្វើការ", "ស្ថានភាព"].map((h) => <th key={h} className="text-left p-1.5" style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id}>
                  <td className="p-1.5" style={td}>{w.name}</td>
                  <td className="p-1.5" style={td}>{w.gender ? GENDER_LABELS[w.gender] : ""}</td>
                  <td className="p-1.5" style={td}>{w.phone ?? ""}</td>
                  <td className="p-1.5" style={td}>{w.birthDate ? fmtDate(w.birthDate) : ""}</td>
                  <td className="p-1.5" style={td}>{w.position ?? ""}</td>
                  <td className="p-1.5" style={td}>{w.plot ?? ""}</td>
                  <td className="p-1.5" style={td}>{w.wageType === "monthly" ? "ប្រាក់ខែ" : "ប្រាក់ថ្ងៃ"}</td>
                  <td className="p-1.5" style={td}>{w.wageType === "monthly" || w.dailyRateMode === "hourly" ? fmtCurrency(w.wageRate, w.wageCurrency) : "ប្រែប្រួល"}</td>
                  <td className="p-1.5" style={td}>{w.startDate ? fmtDate(w.startDate) : ""}</td>
                  <td className="p-1.5" style={td}>{w.status === "active" ? "កំពុងធ្វើការ" : "ឈប់ធ្វើការ"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="grid grid-cols-2 gap-8 mt-10 text-[11px]" style={{ color: C.inkSoft }}>
          <div><div className="mb-10">អ្នករៀបចំ</div><div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 4 }}>ហត្ថលេខា និងឈ្មោះ</div></div>
          <div><div className="mb-10">អ្នកអនុម័ត</div><div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 4 }}>ហត្ថលេខា និងឈ្មោះ</div></div>
        </div>
      </div>
    </div>
  );
}
