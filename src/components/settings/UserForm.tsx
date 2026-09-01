import { useState } from "react";
import { Check } from "lucide-react";
import type { AdminCreateUserInput, AdminCreateUserResult } from "@/api";
import type { UserProfile } from "@/types/domain";
import { SheetModal } from "@/components/ui/SheetModal";
import { Field, PrimaryButton, inputCls, inputStyle } from "@/components/ui/primitives";
import { ROLES, SCOPED_ROLES } from "@/lib/permissions";
import { C, tint } from "@/lib/tokens";
import { errorMessage } from "@/lib/errors";

interface Props {
  initial?: UserProfile;
  allPlots: string[];
  onClose: () => void;
  onCreate: (input: AdminCreateUserInput) => Promise<AdminCreateUserResult>;
  onUpdate: (input: { id: string } & Partial<UserProfile>) => Promise<void>;
}

export function UserForm({ initial, allPlots, onClose, onCreate, onUpdate }: Props) {
  const isAdd = !initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [role, setRole] = useState(initial?.role ?? "skilled_worker");
  const [plots, setPlots] = useState<string[]>(initial?.plots ?? []);
  const [customPlot, setCustomPlot] = useState("");
  const [status, setStatus] = useState<UserProfile["status"]>(initial?.status ?? "active");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ email: string; password: string; name: string } | null>(null);

  const togglePlot = (p: string) => setPlots((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  const addCustom = () => { const v = customPlot.trim(); if (v && !plots.includes(v)) setPlots((p) => [...p, v]); setCustomPlot(""); };

  const submit = async () => {
    setError("");
    if (!name.trim()) { setError("សូមបញ្ចូលឈ្មោះ"); return; }
    const finalPlots = SCOPED_ROLES.includes(role) ? plots : [];
    if (isAdd) {
      if (!email.trim() || !password.trim()) { setError("សូមបញ្ចូល email និងពាក្យសម្ងាត់"); return; }
      setBusy(true);
      try {
        await onCreate({ name: name.trim(), email: email.trim(), password, role, plots: finalPlots });
        setCreated({ email: email.trim(), password, name: name.trim() });
      } catch (err) {
        setError(errorMessage(err));
      } finally { setBusy(false); }
    } else {
      setBusy(true);
      try {
        await onUpdate({ id: initial.id, name: name.trim(), phone: phone.trim(), role, plots: finalPlots, status, notes: notes.trim() });
        onClose();
      } finally { setBusy(false); }
    }
  };

  const copyCreds = () => {
    if (!created) return;
    navigator.clipboard?.writeText(`Email: ${created.email}\nពាក្យសម្ងាត់: ${created.password}`);
  };

  if (created) {
    return (
      <SheetModal title="បង្កើតគណនីជោគជ័យ" onClose={onClose}>
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: tint(C.greenMid, 10) }}><Check size={26} color={C.greenMid} /></div>
          <div className="text-sm font-semibold mb-1" style={{ color: C.green }}>{created.name} អាចចូលប្រើប្រព័ន្ធបានភ្លាមៗ</div>
          <div className="text-[11px] mb-4" style={{ color: C.inkSoft }}>មិនចាំបាច់ confirm អ៊ីមែលទេ — ចម្លងព័ត៌មានខាងក្រោមផ្ញើទៅគាត់</div>
          <div className="w-full rounded-xl p-3 text-left text-xs space-y-1.5" style={{ background: C.bgAlt }}>
            <div><span style={{ color: C.inkSoft }}>Email៖ </span><b style={{ color: C.ink }}>{created.email}</b></div>
            <div><span style={{ color: C.inkSoft }}>ពាក្យសម្ងាត់៖ </span><b style={{ color: C.ink }}>{created.password}</b></div>
          </div>
          <button onClick={copyCreds} className="text-xs font-semibold mt-3" style={{ color: C.greenMid }}>ចម្លងព័ត៌មានទាំងអស់</button>
        </div>
        <div className="mt-5"><PrimaryButton full onClick={onClose}>រួចរាល់</PrimaryButton></div>
      </SheetModal>
    );
  }

  return (
    <SheetModal title={isAdd ? "បន្ថែមអ្នកប្រើប្រាស់ថ្មី" : "កែសម្រួលអ្នកប្រើប្រាស់"} onClose={onClose}>
      {isAdd && (
        <div className="rounded-xl p-3 text-[11px] mb-4" style={{ background: tint(C.blue, 12), color: C.brown }}>
          ម្ចាស់ចម្ការជាអ្នកកំណត់ email/ពាក្យសម្ងាត់ដោយផ្ទាល់ — គណនីនឹងប្រើបានភ្លាមៗ សមាជិកមិនចាំបាច់ confirm អ៊ីមែលដោយខ្លួនឯងទេ
        </div>
      )}
      <Field label="ឈ្មោះពេញ *"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      {isAdd && (
        <>
          <Field label="អ៊ីមែល *"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} style={inputStyle} autoCapitalize="none" /></Field>
          <Field label="ពាក្យសម្ងាត់ * (យ៉ាងតិច ៦ តួអក្សរ)"><input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} style={inputStyle} placeholder="កំណត់ពាក្យសម្ងាត់ឲ្យគាត់" /></Field>
        </>
      )}
      <Field label="លេខទូរស័ព្ទ"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <Field label="តួនាទីក្នុងប្រព័ន្ធ">
        <div className="grid grid-cols-1 gap-2">
          {ROLES.filter((r) => r.key !== "owner").map((r) => { const RIcon = r.icon; return (
            <button key={r.key} onClick={() => setRole(r.key)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left" style={{ background: role === r.key ? tint(C.greenMid, 12) : C.bgAlt, border: `1.5px solid ${role === r.key ? C.greenMid : "transparent"}`, color: role === r.key ? C.greenMid : C.ink }}><RIcon size={14} /> {r.label}</button>
          );})}
        </div>
      </Field>
      {SCOPED_ROLES.includes(role) && (
        <Field label="តំបន់/ចម្រៀកទទួលបន្ទុក">
          {allPlots.length > 0 && <div className="flex flex-wrap gap-1.5 mb-2">{allPlots.map((p) => <button key={p} onClick={() => togglePlot(p)} className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: plots.includes(p) ? C.greenMid : C.bgAlt, color: plots.includes(p) ? "#fff" : C.ink }}>{p}</button>)}</div>}
          <div className="flex gap-2"><input value={customPlot} onChange={(e) => setCustomPlot(e.target.value)} placeholder="បន្ថែមតំបន់ថ្មី..." className="flex-1 rounded-lg px-2.5 py-1.5 text-[11px] outline-none" style={{ background: C.bgAlt, border: `1px solid ${C.line}`, color: C.ink }} /><button onClick={addCustom} className="rounded-lg px-2.5 text-[11px] font-semibold" style={{ background: C.bgAlt, color: C.greenMid }}>+</button></div>
        </Field>
      )}
      {!isAdd && (
        <Field label="ស្ថានភាព"><div className="grid grid-cols-2 gap-2"><button onClick={() => setStatus("active")} className="rounded-xl px-3 py-2 text-xs font-medium" style={{ background: status === "active" ? tint(C.greenMid, 12) : C.bgAlt, color: status === "active" ? C.greenMid : C.ink }}>សកម្ម</button><button onClick={() => setStatus("inactive")} className="rounded-xl px-3 py-2 text-xs font-medium" style={{ background: status === "inactive" ? tint(C.red, 12) : C.bgAlt, color: status === "inactive" ? C.red : C.ink }}>អសកម្ម</button></div></Field>
      )}
      <Field label="កំណត់ចំណាំ"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} style={inputStyle} /></Field>
      {error && <div className="rounded-xl px-3 py-2.5 text-[11px] mb-4" style={{ background: tint(C.red, 12), color: C.red }}>{error}</div>}
      <PrimaryButton full onClick={submit} disabled={busy}>{busy ? "កំពុងបង្កើត..." : isAdd ? "បង្កើតគណនី" : "រក្សាទុកការផ្លាស់ប្តូរ"}</PrimaryButton>
    </SheetModal>
  );
}
