import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { SheetModal } from "@/components/ui/SheetModal";
import { Field, PrimaryButton, inputCls, inputStyle } from "@/components/ui/primitives";
import { fmtDate, todayISO } from "@/lib/format";
import { C } from "@/lib/tokens";
import type { Tree, YieldEvent } from "@/types/domain";

interface Props {
  events: YieldEvent[]; // already filtered to type === "harvested"
  trees: Tree[];
  farmName: string;
  onClose: () => void;
  onSubmit: (input: { farmName: string; packedDate: string; destination?: string | null; notes?: string | null; eventIds: string[] }) => Promise<void>;
}

export function BatchForm({ events, trees, farmName, onClose, onSubmit }: Props) {
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const [start, setStart] = useState(weekAgo);
  const [end, setEnd] = useState(todayISO());
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [packedDate, setPackedDate] = useState(todayISO());
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const treeName = (id: string) => trees.find((t) => t.id === id)?.code ?? "—";
  const candidates = useMemo(
    () => events.filter((e) => e.date >= start && e.date <= end).sort((a, b) => b.date.localeCompare(a.date)),
    [events, start, end]
  );
  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const totalQty = candidates.filter((e) => selected[e.id]).reduce((s, e) => s + e.quantity, 0);

  const submit = async () => {
    if (selectedIds.length === 0) return;
    setBusy(true);
    try {
      await onSubmit({ farmName, packedDate, destination: destination.trim() || null, notes: notes.trim() || null, eventIds: selectedIds });
      onClose();
    } finally { setBusy(false); }
  };

  return (
    <SheetModal title="បង្កើតបាច់ប្រមូលផលថ្មី" onClose={onClose}>
      <div className="rounded-xl p-3 text-[11px] mb-4" style={{ background: `color-mix(in srgb, ${C.blue} 10%, transparent)`, color: C.brown }}>
        ជ្រើសរើសកំណត់ត្រាប្រមូលផលដែលនឹងវេចខ្ចប់ជាមួយគ្នា — ប្រព័ន្ធនឹងបង្កើតកូដ QR មួយ ដែលអ្នកទិញអាចស្កេនមើលប្រភពដើមទាំងអស់
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Field label="ពីថ្ងៃ"><input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} style={inputStyle} /></Field>
        <Field label="ដល់ថ្ងៃ"><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      </div>

      {candidates.length === 0 ? (
        <div className="text-xs mb-4" style={{ color: C.inkSoft }}>គ្មានកំណត់ត្រាប្រមូលផលក្នុងចន្លោះថ្ងៃនេះទេ</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setSelected(candidates.every((e) => selected[e.id]) ? {} : Object.fromEntries(candidates.map((e) => [e.id, true])))} className="text-[11px] font-semibold" style={{ color: C.greenMid }}>
              {candidates.every((e) => selected[e.id]) ? "ដកការជ្រើសទាំងអស់" : "ជ្រើសទាំងអស់"}
            </button>
            <div className="text-[11px]" style={{ color: C.inkSoft }}>ជ្រើស {selectedIds.length}/{candidates.length} · {totalQty} ផ្លែ</div>
          </div>
          <div className="space-y-1.5 mb-4 max-h-64 overflow-y-auto">
            {candidates.map((e) => {
              const on = !!selected[e.id];
              return (
                <button key={e.id} onClick={() => setSelected((s) => ({ ...s, [e.id]: !on }))} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left" style={{ background: on ? `color-mix(in srgb, ${C.greenMid} 10%, transparent)` : C.bgAlt, border: `1px solid ${on ? C.greenMid : "transparent"}` }}>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: on ? C.greenMid : C.card, border: `1px solid ${on ? C.greenMid : C.line}` }}>
                    {on && <Check size={13} color="#fff" />}
                  </div>
                  <div className="flex-1 min-w-0 text-xs" style={{ color: C.ink }}>{treeName(e.treeId)} · {fmtDate(e.date)} · {e.quantity} ផ្លែ{e.weightKg ? ` · ${e.weightKg}kg` : ""}</div>
                </button>
              );
            })}
          </div>
        </>
      )}

      <Field label="ថ្ងៃវេចខ្ចប់"><input type="date" value={packedDate} onChange={(e) => setPackedDate(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <Field label="ទិសដៅ/អ្នកទិញ (ស្រេចចិត្ត)"><input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="ឧ. ក្រុមហ៊ុន X ខេត្តគួងចូវ ចិន" className={inputCls} style={inputStyle} /></Field>
      <Field label="កំណត់ចំណាំ"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} style={inputStyle} /></Field>

      <PrimaryButton full onClick={submit} disabled={busy || selectedIds.length === 0}>{busy ? "កំពុងបង្កើត..." : `បង្កើតបាច់ (${selectedIds.length})`}</PrimaryButton>
    </SheetModal>
  );
}
