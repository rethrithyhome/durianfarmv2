import { useState } from "react";
import type { Worker } from "@/types/domain";
import { SheetModal } from "@/components/ui/SheetModal";
import { Field, PrimaryButton, inputCls, inputStyle } from "@/components/ui/primitives";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { C } from "@/lib/tokens";

interface Props {
  initial?: Worker;
  allowedPlots: string[] | null;
  onClose: () => void;
  onSubmit: (w: Partial<Worker>) => Promise<void>;
}

export function WorkerForm({ initial, allowedPlots, onClose, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [position, setPosition] = useState(initial?.position ?? "");
  const [specialty, setSpecialty] = useState(initial?.specialty ?? "");
  const [plot, setPlot] = useState(initial?.plot ?? (allowedPlots?.[0] ?? ""));
  const [status, setStatus] = useState<Worker["status"]>(initial?.status ?? "active");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [photo, setPhoto] = useState<string | null>(initial?.photo ?? null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSubmit({ ...(initial ?? {}), name: name.trim(), phone: phone.trim(), position: position.trim(), specialty: specialty.trim(), plot: plot.trim(), status, notes: notes.trim(), photo });
      onClose();
    } finally { setBusy(false); }
  };

  return (
    <SheetModal title={initial ? "កែសម្រួលកម្មករ" : "បន្ថែមកម្មករថ្មី"} onClose={onClose}>
      <PhotoPicker value={photo} onChange={setPhoto} label="រូបថតកម្មករ" maxDim={480} quality={0.65} folder="workers" />
      <Field label="ឈ្មោះពេញ *"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <Field label="លេខទូរស័ព្ទ"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <Field label="តួនាទី/មុខតំណែង"><input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="ឧ. កម្មករបេះផ្លែ" className={inputCls} style={inputStyle} /></Field>
      <Field label="ជំនាញឯកទេស"><input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="ឧ. ព្យាបាលជំងឺដើម" className={inputCls} style={inputStyle} /></Field>
      <Field label="ចម្រៀក/តំបន់ទទួលបន្ទុក">
        {allowedPlots && allowedPlots.length > 0 ? (
          <select value={plot} onChange={(e) => setPlot(e.target.value)} className={inputCls} style={inputStyle}>{allowedPlots.map((p) => <option key={p} value={p}>{p}</option>)}</select>
        ) : (<input value={plot} onChange={(e) => setPlot(e.target.value)} className={inputCls} style={inputStyle} />)}
      </Field>
      <Field label="ស្ថានភាព">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setStatus("active")} className="rounded-xl px-3 py-2 text-xs font-medium" style={{ background: status === "active" ? `color-mix(in srgb, ${C.greenMid} 12%, transparent)` : C.bgAlt, color: status === "active" ? C.greenMid : C.ink }}>កំពុងធ្វើការ</button>
          <button onClick={() => setStatus("inactive")} className="rounded-xl px-3 py-2 text-xs font-medium" style={{ background: status === "inactive" ? `color-mix(in srgb, ${C.red} 12%, transparent)` : C.bgAlt, color: status === "inactive" ? C.red : C.ink }}>ឈប់ធ្វើការ</button>
        </div>
      </Field>
      <Field label="កំណត់ចំណាំ"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} style={inputStyle} /></Field>
      <PrimaryButton full onClick={submit} disabled={busy}>{busy ? "កំពុងរក្សាទុក..." : initial ? "រក្សាទុកការផ្លាស់ប្តូរ" : "បន្ថែមកម្មករ"}</PrimaryButton>
    </SheetModal>
  );
}
