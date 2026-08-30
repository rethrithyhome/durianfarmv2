import { useState } from "react";
import type { Customer } from "@/types/domain";
import { SheetModal } from "@/components/ui/SheetModal";
import { Field, PrimaryButton, inputCls, inputStyle } from "@/components/ui/primitives";
import { SALE_TYPES } from "@/lib/constants";
import { C } from "@/lib/tokens";

interface Props { initial?: Customer; onClose: () => void; onSubmit: (c: Partial<Customer>) => Promise<void> }

export function CustomerForm({ initial, onClose, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [type, setType] = useState<Customer["type"]>(initial?.type ?? "retail");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try { await onSubmit({ ...(initial ?? {}), name: name.trim(), phone: phone.trim(), type, address: address.trim(), notes: notes.trim() }); onClose(); }
    finally { setBusy(false); }
  };

  return (
    <SheetModal title={initial ? "កែសម្រួលអតិថិជន" : "បន្ថែមអតិថិជនថ្មី"} onClose={onClose}>
      <Field label="ឈ្មោះអតិថិជន *"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <Field label="លេខទូរស័ព្ទ"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <Field label="ប្រភេទសំខាន់">
        <div className="grid grid-cols-2 gap-2">{SALE_TYPES.map((t) => <button key={t.key} onClick={() => setType(t.key)} className="rounded-xl px-3 py-2 text-xs font-medium" style={{ background: type === t.key ? `color-mix(in srgb, ${C.greenMid} 12%, transparent)` : C.bgAlt, color: type === t.key ? C.greenMid : C.ink }}>{t.label}</button>)}</div>
      </Field>
      <Field label="អាសយដ្ឋាន/តំបន់"><input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <Field label="កំណត់ចំណាំ"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} style={inputStyle} /></Field>
      <PrimaryButton full onClick={submit} disabled={busy}>{busy ? "កំពុងរក្សាទុក..." : initial ? "រក្សាទុកការផ្លាស់ប្តូរ" : "បន្ថែមអតិថិជន"}</PrimaryButton>
    </SheetModal>
  );
}
