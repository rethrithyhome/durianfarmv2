import { ArrowUpDown } from "lucide-react";
import { C } from "@/lib/tokens";

export interface SortOption<K extends string> { key: K; label: string }

export function SortMenu<K extends string>({ value, options, onChange }: { value: K; options: SortOption<K>[]; onChange: (v: K) => void }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 shrink-0" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <ArrowUpDown size={13} color={C.inkSoft} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as K)}
        className="bg-transparent text-[11px] font-medium outline-none"
        style={{ color: C.ink }}
      >
        {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    </div>
  );
}
