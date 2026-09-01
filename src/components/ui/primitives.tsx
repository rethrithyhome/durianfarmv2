import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { C, tint, R, SHADOW } from "@/lib/tokens";

export function Badge({ label, color, size = "sm" }: { label?: string; color: string; size?: "sm" | "md" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1"}`}
      style={{ background: tint(color, 10), color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}

export function StatCard({ label, value, sub, accent, icon: Icon }: { label: string; value: string | number; sub?: string; accent?: string; icon?: LucideIcon }) {
  const tone = accent || C.green;
  return (
    <div className="relative p-3.5 overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: R.lg, boxShadow: SHADOW.card }}>
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: tone }} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px]" style={{ color: C.inkSoft }}>{label}</div>
          <div className="text-2xl mt-0.5 leading-tight" style={{ color: tone, fontWeight: "var(--font-heading-weight)" as never, letterSpacing: "-0.02em" }}>{value}</div>
          {sub && <div className="text-[11px] mt-0.5" style={{ color: C.inkSoft }}>{sub}</div>}
        </div>
        {Icon && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: tint(tone, 12) }}>
            <Icon size={14} color={tone} />
          </div>
        )}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block mb-4">
      <div className="text-[12.5px] font-medium mb-1.5" style={{ color: C.inkSoft }}>{label}</div>
      {children}
    </label>
  );
}

export const inputCls = "w-full rounded-xl px-3.5 py-2.5 text-sm outline-none";
export const inputStyle = { background: C.bgAlt, border: `1px solid ${C.line}`, color: C.ink };

export function PrimaryButton({ children, onClick, full, danger, disabled }: { children: ReactNode; onClick?: () => void; full?: boolean; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${full ? "w-full" : ""} px-4 py-2.5 text-sm flex items-center justify-center gap-1.5 disabled:opacity-60`}
      style={{
        background: danger ? C.red : `linear-gradient(135deg, ${C.green}, ${C.greenMid})`,
        color: "#fff",
        fontWeight: 700,
        borderRadius: R.base,
        boxShadow: SHADOW.card,
      }}
    >
      {children}
    </button>
  );
}

export function EmptyState({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-14 h-14 flex items-center justify-center mb-3" style={{ background: C.bgAlt, borderRadius: R.lg }}><Icon size={24} color={C.goldDeep} /></div>
      <div className="font-semibold text-sm" style={{ color: C.green }}>{title}</div>
      <div className="text-xs mt-1 max-w-xs" style={{ color: C.inkSoft }}>{hint}</div>
    </div>
  );
}

export function FilterChip({ active, onClick, label, color }: { active: boolean; onClick: () => void; label?: string; color?: string }) {
  return (
    <button
      onClick={onClick}
      className="whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium shrink-0"
      style={{ background: active ? (color || C.green) : C.card, color: active ? "#fff" : C.inkSoft, border: `1px solid ${active ? "transparent" : C.line}` }}
    >
      {label}
    </button>
  );
}
