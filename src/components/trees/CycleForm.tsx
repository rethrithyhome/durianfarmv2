import { useState } from "react";
import type { YieldCycle } from "@/types/domain";
import { SheetModal } from "@/components/ui/SheetModal";
import { Field, PrimaryButton, inputCls, inputStyle } from "@/components/ui/primitives";
import { thisYear } from "@/lib/format";

interface Props {
  treeId: string;
  onClose: () => void;
  onSubmit: (cy: Partial<YieldCycle>) => Promise<void>;
}

export function CycleForm({ treeId, onClose, onSubmit }: Props) {
  const [year, setYear] = useState(thisYear);
  const [flowerDate, setFlowerDate] = useState("");
  const [initialCount, setInitialCount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!initialCount) return;
    setBusy(true);
    try {
      await onSubmit({ treeId, year: Number(year), flowerDate, initialCount: Number(initialCount), note: note.trim() });
      onClose();
    } finally { setBusy(false); }
  };

  return (
    <SheetModal title="ចាប់ផ្តើមទិន្នផលឆ្នាំថ្មី" onClose={onClose}>
      <Field label="ឆ្នាំ *"><input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputCls} style={inputStyle} /></Field>
      <Field label="ថ្ងៃចេញផ្កា"><input type="date" value={flowerDate} onChange={(e) => setFlowerDate(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <Field label="ចំនួនផ្លែតូចដំបូង *"><input type="number" min="0" value={initialCount} onChange={(e) => setInitialCount(e.target.value)} placeholder="ចំនួនផ្លែតូចដែលឃើញលើដើម" className={inputCls} style={inputStyle} /></Field>
      <Field label="កំណត់ចំណាំ"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputCls} style={inputStyle} /></Field>
      <PrimaryButton full onClick={submit} disabled={busy}>{busy ? "កំពុងចាប់ផ្តើម..." : "ចាប់ផ្តើមកត់ត្រា"}</PrimaryButton>
    </SheetModal>
  );
}
