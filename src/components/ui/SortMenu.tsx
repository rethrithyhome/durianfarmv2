import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Check } from "lucide-react";
import { C, tint } from "@/lib/tokens";

export type SortDir = "asc" | "desc";
export interface SortOption<K extends string> { key: K; label: string; defaultDir?: SortDir }
export interface SortValue<K extends string> { key: K; dir: SortDir }

/**
 * A dropdown that remembers direction per field — clicking the option
 * that's already active flips ascending/descending instead of doing
 * nothing, which a native <select> can't do (re-picking the same value
 * never fires onChange). Clicking a different option switches to it
 * using that option's sensible default direction.
 */
export function SortMenu<K extends string>({
  value, options, onChange,
}: {
  value: SortValue<K>;
  options: SortOption<K>[];
  onChange: (v: SortValue<K>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.key === value.key) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const pick = (o: SortOption<K>) => {
    if (o.key === value.key) {
      onChange({ key: o.key, dir: value.dir === "asc" ? "desc" : "asc" });
    } else {
      onChange({ key: o.key, dir: o.defaultDir ?? "asc" });
    }
    setOpen(false);
  };

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-xl px-2.5 py-2"
        style={{ background: C.card, border: `1px solid ${C.line}` }}
      >
        <ArrowUpDown size={13} color={C.inkSoft} />
        <span className="text-[11px] font-medium" style={{ color: C.ink }}>{current?.label}</span>
        {value.dir === "asc" ? <ArrowUp size={12} color={C.greenMid} /> : <ArrowDown size={12} color={C.greenMid} />}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-20 py-1.5 overflow-hidden"
          style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: "var(--shadow-float)", minWidth: 180 }}
        >
          {options.map((o) => {
            const active = o.key === value.key;
            return (
              <button
                key={o.key}
                onClick={() => pick(o)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left"
                style={{ background: active ? tint(C.greenMid, 10) : "transparent" }}
              >
                <span className="text-xs" style={{ color: active ? C.greenMid : C.ink, fontWeight: active ? 600 : 400 }}>{o.label}</span>
                {active ? (
                  value.dir === "asc" ? <ArrowUp size={13} color={C.greenMid} /> : <ArrowDown size={13} color={C.greenMid} />
                ) : (
                  <Check size={13} color="transparent" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
