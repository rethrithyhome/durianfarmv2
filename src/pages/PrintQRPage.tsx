import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmSettings } from "@/hooks/useFarmSettings";
import { useTrees } from "@/hooks/useTrees";
import { qrImageUrl, treeDeepLink } from "@/lib/qr";
import { C } from "@/lib/tokens";

export function PrintQRPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const enabled = !!profile?.farmId;
  const farmQ = useFarmSettings(enabled);
  const treesQ = useTrees(enabled);
  const trees = treesQ.data ?? [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: C.bg }}>
      <div className="no-print sticky top-0 flex items-center justify-between px-4 lg:px-8 py-3" style={{ background: C.card, borderBottom: `1px solid ${C.line}` }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-medium" style={{ color: C.greenMid }}><ArrowLeft size={15} /> ត្រឡប់ក្រោយ</button>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: C.green, color: "#fff" }}><Printer size={13} /> បោះពុម្ព</button>
      </div>
      <div className="print-area p-4 lg:p-8 max-w-4xl mx-auto">
        <h1 className="text-base font-bold mb-1" style={{ color: C.green }}>{farmQ.data?.farmName ?? ""}</h1>
        <div className="text-[11px] mb-4" style={{ color: C.inkSoft }}>កូដ QR សម្រាប់ដើមទុរេន ({trees.length} ដើម)</div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {trees.map((t) => (
            <div key={t.id} className="rounded-xl p-2 text-center" style={{ border: `1px solid ${C.line}` }}>
              <img src={qrImageUrl(treeDeepLink(t.id), 200)} alt={t.code} className="w-full h-auto" />
              <div className="text-[11px] font-bold mt-1" style={{ color: C.ink }}>{t.code}</div>
              <div className="text-[9px]" style={{ color: C.inkSoft }}>{t.plot || ""}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
