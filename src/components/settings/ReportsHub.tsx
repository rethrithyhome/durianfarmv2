import { useNavigate } from "react-router-dom";
import { QrCode, FileBarChart, Users, TreePine, Receipt, Wallet, History, ChevronRight, type LucideIcon } from "lucide-react";
import { can } from "@/lib/permissions";
import { C, tint } from "@/lib/tokens";
import type { Role } from "@/types/domain";

interface ReportEntry {
  path: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  show: boolean;
}

export function ReportsHub({ role }: { role: Role }) {
  const navigate = useNavigate();
  const canReports = can(role, "viewReports");

  const entries: ReportEntry[] = [
    { path: "/reports", label: "របាយការណ៍ហិរញ្ញវត្ថុប្រចាំឆ្នាំ", desc: "ចំណូល ចំណាយ ចំណេញសុទ្ធ", icon: FileBarChart, show: canReports },
    { path: "/worker-report", label: "តារាងកម្មករ", desc: "បញ្ជីកម្មករពេញលេញ ព្រីន/CSV", icon: Users, show: canReports },
    { path: "/tree-report", label: "តារាងដើមទុរេន", desc: "សុខភាព ចម្រៀក ពូជ", icon: TreePine, show: canReports },
    { path: "/expense-report", label: "តារាងចំណាយ", desc: "តាមចន្លោះថ្ងៃ ចាត់ថ្នាក់តាមប្រភេទ", icon: Receipt, show: canReports },
    { path: "/payroll-report", label: "តារាងចំណាយប្រាក់ឈ្នួល", desc: "ប្រាក់ថ្ងៃ (pivot) / ប្រាក់ខែ", icon: Wallet, show: canReports },
    { path: "/print-qr", label: "បោះពុម្ព QR ដើមទុរេន", desc: "ស្លាកសម្រាប់បិទលើដើម", icon: QrCode, show: canReports },
    { path: "/audit", label: "ប្រវត្តិកែប្រែទិន្នន័យ", desc: "អ្នកណាកែអ្វី ពេលណា", icon: History, show: can(role, "viewUsers") },
  ];

  return (
    <div className="space-y-2">
      {entries.filter((e) => e.show).map((e) => (
        <button
          key={e.path}
          onClick={() => navigate(e.path)}
          className="w-full flex items-center gap-3 rounded-2xl p-3.5 text-left"
          style={{ background: C.card, border: `1px solid ${C.line}` }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint(C.green, 12) }}>
            <e.icon size={18} color={C.green} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: C.green }}>{e.label}</div>
            <div className="text-[11px] truncate" style={{ color: C.inkSoft }}>{e.desc}</div>
          </div>
          <ChevronRight size={16} color={C.inkSoft} />
        </button>
      ))}
    </div>
  );
}
