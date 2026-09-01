import { Check } from "lucide-react";
import { THEMES } from "@/lib/theme";
import { C, tint } from "@/lib/tokens";
import { ThemeMark } from "@/components/ui/ThemeMark";

export function ThemePicker({ current, onChange }: { current: string; onChange: (key: string) => void }) {
  return (
    <div className="space-y-2.5">
      <div className="text-[11px]" style={{ color: C.inkSoft }}>
        រចនាបថនីមួយៗប្តូរទាំងពណ៌ ពុម្ពអក្សរ ទម្រង់ជ្រុង និងស្រមោល — ចុចដើម្បីមើលភ្លាមៗ
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.values(THEMES).map((t) => {
          const active = current === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className="text-left overflow-hidden"
              style={{
                background: t.colors.bg,
                border: `2px solid ${active ? t.colors.green : t.colors.line}`,
                borderRadius: t.radiusLg,
                boxShadow: active ? t.shadowLg : t.shadow,
              }}
            >
              {/* Preview header — uses the theme's own colors and mark */}
              <div className="flex items-center gap-2.5 px-3.5 py-3" style={{ background: `linear-gradient(135deg, ${t.colors.green}, ${t.colors.greenMid})` }}>
                <ThemeMark style={t.mark} size={30} primary="#fff" accent={t.colors.gold} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] truncate" style={{ color: "#fff", fontFamily: t.font, fontWeight: t.headingWeight }}>{t.label}</div>
                  <div className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.75)", fontFamily: t.font }}>{t.tagline}</div>
                </div>
                {active && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.22)" }}>
                    <Check size={13} color="#fff" />
                  </div>
                )}
              </div>

              {/* Preview body — a miniature card and button in that theme */}
              <div className="px-3.5 py-3">
                <div className="p-2.5 mb-2" style={{ background: t.colors.card, border: `1px solid ${t.colors.line}`, borderRadius: t.radius, boxShadow: t.shadow }}>
                  <div className="text-[10px]" style={{ color: t.colors.inkSoft, fontFamily: t.font }}>ដើមទុរេនសរុប</div>
                  <div className="text-lg leading-tight" style={{ color: t.colors.green, fontFamily: t.font, fontWeight: t.headingWeight }}>128</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 text-[10px]" style={{ background: `linear-gradient(135deg, ${t.colors.green}, ${t.colors.greenMid})`, color: "#fff", borderRadius: t.radius, fontFamily: t.font, fontWeight: 700 }}>
                    រក្សាទុក
                  </div>
                  <div className="px-2.5 py-1 text-[10px]" style={{ background: tint(t.colors.gold, 30), color: t.colors.goldDeep, borderRadius: t.radius, fontFamily: t.font }}>
                    ធម្មតា
                  </div>
                  <div className="ml-auto flex gap-1">
                    {t.swatch.map((c) => <span key={c} className="w-3.5 h-3.5 rounded-full" style={{ background: c }} />)}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
