import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Package, MapPin, Calendar, Leaf } from "lucide-react";
import { fetchTraceBatch } from "@/api/batches";
import { CARE_TYPES } from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import { applyThemeVars, DEFAULT_THEME } from "@/lib/theme";
import { C } from "@/lib/tokens";
import { DurianMark } from "@/components/ui/DurianMark";
import type { TraceBatchResult } from "@/types/domain";

function careLabel(type: string) {
  return CARE_TYPES.find((c) => c.key === type)?.label ?? type;
}

export function PublicTracePage() {
  const { code } = useParams();
  const [data, setData] = useState<TraceBatchResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyThemeVars(DEFAULT_THEME);
    if (!code) return;
    fetchTraceBatch(code)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <DurianMark size={48} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: C.bg }}>
        <DurianMark size={48} />
        <div className="text-sm font-semibold mt-3" style={{ color: C.red }}>{error || "រកមិនឃើញព័ត៌មានទេ"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex flex-col items-center text-center mb-6">
          {data.farmLogo ? <img src={data.farmLogo} alt="logo" className="w-16 h-16 rounded-full object-cover mb-2" /> : <DurianMark size={56} />}
          <div className="font-extrabold text-base" style={{ color: C.green }}>{data.farmName}</div>
          <div className="text-[11px]" style={{ color: C.inkSoft }}>ព័ត៌មានប្រភពដើម — ស្កេនដោយអតិថិជន</div>
        </div>

        <div className="rounded-2xl p-4 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} color={C.greenMid} />
            <div className="text-sm font-bold" style={{ color: C.green }}>បាច់ {data.batchCode}</div>
          </div>
          <div className="text-[11px] flex items-center gap-1.5" style={{ color: C.inkSoft }}>
            <Calendar size={11} /> វេចខ្ចប់ថ្ងៃ {fmtDate(data.packedDate)}
          </div>
          {data.destination && (
            <div className="text-[11px] flex items-center gap-1.5 mt-0.5" style={{ color: C.inkSoft }}>
              <MapPin size={11} /> {data.destination}
            </div>
          )}
        </div>

        <div className="text-sm font-bold mb-2" style={{ color: C.green }}>ដើមទុរេនក្នុងបាច់នេះ ({data.trees.length})</div>
        <div className="space-y-3">
          {data.trees.map((t, i) => (
            <div key={i} className="rounded-2xl p-3.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-bold" style={{ color: C.ink }}>{t.treeCode}</div>
                <div className="text-[11px]" style={{ color: C.inkSoft }}>{t.quantity} ផ្លែ{t.weightKg ? ` · ${t.weightKg}kg` : ""}</div>
              </div>
              <div className="text-[11px] mb-2" style={{ color: C.inkSoft }}>
                {t.plot ? `ចម្រៀក ${t.plot}` : ""}{t.plot && t.variety ? " · " : ""}{t.variety ?? ""}{" · "}បេះថ្ងៃ {fmtDate(t.harvestDate)}
              </div>
              {t.careLogs.length > 0 && (
                <div className="rounded-xl p-2.5" style={{ background: C.bgAlt }}>
                  <div className="flex items-center gap-1.5 text-[10.5px] font-semibold mb-1.5" style={{ color: C.greenMid }}>
                    <Leaf size={11} /> ប្រវត្តិការថែទាំ
                  </div>
                  <div className="space-y-1">
                    {t.careLogs.map((c, j) => (
                      <div key={j} className="text-[10.5px]" style={{ color: C.ink }}>
                        {fmtDate(c.date)} · {careLabel(c.type)}{c.note ? ` — ${c.note}` : ""}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center text-[10px] mt-8" style={{ color: C.inkSoft }}>
          ព័ត៌មាននេះផ្តល់ដោយចម្ការផ្ទាល់ ដើម្បីតម្លាភាពនិងទំនុកចិត្តរបស់អតិថិជន
        </div>
      </div>
    </div>
  );
}
