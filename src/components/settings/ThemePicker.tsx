import { Check } from "lucide-react";
import { THEMES } from "@/lib/theme";
import { C, tint } from "@/lib/tokens";

export function ThemePicker({ current, onChange }: { current: string; onChange: (key: string) => void }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="text-sm font-semibold mb-1" style={{ color: C.green }}>ពណ៌ Interface (Theme)</div>
      <div className="text-[11px] mb-3" style={{ color: C.inkSoft }}>ជ្រើសរើសពណ៌ដែលស្តែងចេញពីធម្មជាតិ — ប្តូរបានភ្លាមៗ</div>
      <div className="grid grid-cols-2 gap-2.5">
        {Object.values(THEMES).map((t) => {
          const active = current === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className="rounded-xl p-2.5 flex items-center gap-2.5 text-left"
              style={{ background: active ? tint(t.colors.green, 14) : C.bgAlt, border: `1.5px solid ${active ? t.colors.green : "transparent"}` }}
            >
              <div className="flex shrink-0 rounded-lg overflow-hidden">
                <div style={{ width: 14, height: 26, background: t.swatch[0] }} />
                <div style={{ width: 14, height: 26, background: t.swatch[1] }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: C.ink }}>{t.label}</div>
              </div>
              {active && <Check size={14} color={t.colors.green} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
