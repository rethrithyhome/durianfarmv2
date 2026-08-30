import { useState } from "react";
import type { CareLog, Worker } from "@/types/domain";
import { SheetModal } from "@/components/ui/SheetModal";
import { Field, PrimaryButton, inputCls, inputStyle } from "@/components/ui/primitives";
import { CARE_TYPES } from "@/lib/constants";
import { todayISO } from "@/lib/format";
import { C } from "@/lib/tokens";

interface Props {
  treeId: string;
  workers: Worker[];
  onClose: () => void;
  onSubmit: (c: Partial<CareLog>) => Promise<void>;
}

export function CareForm({ treeId, workers, onClose, onSubmit }: Props) {
  const [type, setType] = useState<CareLog["type"]>("watering");
  const [date, setDate] = useState(todayISO());
  const [workerId, setWorkerId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await onSubmit({ treeId, type, date, workerId: workerId || null, note: note.trim() });
      onClose();
    } finally { setBusy(false); }
  };

  return (
    <SheetModal title="កត់ត្រាការថែទាំថ្មី" onClose={onClose}>
      <Field label="ប្រភេទការថែទាំ">
        <div className="grid grid-cols-2 gap-2">
          {CARE_TYPES.map((c) => { const Icon = c.icon; return (
            <button key={c.key} onClick={() => setType(c.key)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left" style={{ background: type === c.key ? `color-mix(in srgb, ${c.color} 12%, transparent)` : C.bgAlt, border: `1.5px solid ${type === c.key ? c.color : "transparent"}`, color: type === c.key ? c.color : C.ink }}><Icon size={14} /> {c.label}</button>
          );})}
        </div>
      </Field>
      <Field label="កាលបរិច្ឆេទ"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <Field label="កម្មករអនុវត្ត">
        <select value={workerId} onChange={(e) => setWorkerId(e.target.value)} className={inputCls} style={inputStyle}>
          <option value="">មិនបញ្ជាក់</option>
          {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </Field>
      <Field label="កំណត់ចំណាំ"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputCls} style={inputStyle} /></Field>
      <PrimaryButton full onClick={submit} disabled={busy}>{busy ? "កំពុងរក្សាទុក..." : "រក្សាទុកកំណត់ត្រា"}</PrimaryButton>
    </SheetModal>
  );
}
