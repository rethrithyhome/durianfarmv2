import { useState } from "react";
import { ListFilter, Check } from "lucide-react";
import { SheetModal } from "./SheetModal";
import { PrimaryButton } from "./primitives";
import { C, tint } from "@/lib/tokens";

interface Option<K extends string> { key: K; label: string }

/**
 * A button that opens a checklist of options — pick any number, not just
 * one. Used where a single-select chip row would either force one
 * choice or need an unbounded row of chips (e.g. expense categories).
 */
export function MultiSelectFilter<K extends string>({
  label, options, selected, onChange,
}: {
  label: string;
  options: Option<K>[];
  selected: Set<K>;
  onChange: (next: Set<K>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Set<K>>(selected);

  const openPicker = () => { setDraft(new Set(selected)); setOpen(true); };
  const toggle = (k: K) => {
    const next = new Set(draft);
    next.has(k) ? next.delete(k) : next.add(k);
    setDraft(next);
  };
  const apply = () => { onChange(draft); setOpen(false); };
  const allOn = draft.size === options.length;

  return (
    <>
      <button onClick={openPicker} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-medium shrink-0" style={{ background: selected.size > 0 ? tint(C.greenMid, 12) : C.card, border: `1px solid ${selected.size > 0 ? C.greenMid : C.line}`, color: selected.size > 0 ? C.greenMid : C.inkSoft }}>
        <ListFilter size={13} />
        {label}{selected.size > 0 ? ` (${selected.size})` : ""}
      </button>

      {open && (
        <SheetModal title={label} onClose={() => setOpen(false)}>
          <button onClick={() => setDraft(allOn ? new Set() : new Set(options.map((o) => o.key)))} className="text-[11px] font-semibold mb-3" style={{ color: C.greenMid }}>
            {allOn ? "ដកការជ្រើសទាំងអស់" : "ជ្រើសទាំងអស់"}
          </button>
          <div className="space-y-1.5 mb-5">
            {options.map((o) => {
              const on = draft.has(o.key);
              return (
                <button key={o.key} onClick={() => toggle(o.key)} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left" style={{ background: on ? tint(C.greenMid, 10) : C.bgAlt }}>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: on ? C.greenMid : C.card, border: `1px solid ${on ? C.greenMid : C.line}` }}>
                    {on && <Check size={13} color="#fff" />}
                  </div>
                  <span className="text-xs font-medium" style={{ color: C.ink }}>{o.label}</span>
                </button>
              );
            })}
          </div>
          <PrimaryButton full onClick={apply}>អនុវត្ត{draft.size > 0 ? ` (${draft.size})` : ""}</PrimaryButton>
        </SheetModal>
      )}
    </>
  );
}
