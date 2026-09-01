import { useState } from "react";
import * as api from "@/api";
import { Field, PrimaryButton, inputCls, inputStyle } from "@/components/ui/primitives";
import { C, tint } from "@/lib/tokens";
import { errorMessage } from "@/lib/errors";

export function PasswordCard() {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async () => {
    setMsg(null);
    if (pw.length < 6) { setMsg({ ok: false, text: "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ" }); return; }
    if (pw !== pw2) { setMsg({ ok: false, text: "ពាក្យសម្ងាត់ទាំងពីរមិនដូចគ្នាទេ" }); return; }
    setBusy(true);
    try {
      await api.changeMyPassword(pw);
      setMsg({ ok: true, text: "ប្តូរពាក្យសម្ងាត់ជោគជ័យ" });
      setPw(""); setPw2("");
      setTimeout(() => { setOpen(false); setMsg(null); }, 1500);
    } catch (err) {
      setMsg({ ok: false, text: errorMessage(err) });
    } finally { setBusy(false); }
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold" style={{ color: C.green }}>ពាក្យសម្ងាត់របស់ខ្ញុំ</div>
          <div className="text-[11px]" style={{ color: C.inkSoft }}>ប្តូរដោយខ្លួនឯង មិនចាំបាច់សុំម្ចាស់ចម្ការ</div>
        </div>
        {!open && <button onClick={() => setOpen(true)} className="rounded-xl px-3 py-1.5 text-[11px] font-semibold" style={{ background: C.bgAlt, color: C.green }}>ប្តូរ</button>}
      </div>
      {open && (
        <div className="mt-3">
          <Field label="ពាក្យសម្ងាត់ថ្មី"><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="បញ្ជាក់ពាក្យសម្ងាត់ថ្មី"><input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} className={inputCls} style={inputStyle} /></Field>
          {msg && <div className="rounded-xl px-3 py-2.5 text-[11px] mb-3" style={{ background: msg.ok ? tint(C.greenMid, 10) : tint(C.red, 10), color: msg.ok ? C.greenMid : C.red }}>{msg.text}</div>}
          <div className="flex gap-2">
            <button onClick={() => { setOpen(false); setPw(""); setPw2(""); setMsg(null); }} className="flex-1 rounded-xl py-2.5 text-xs font-semibold" style={{ background: C.bgAlt, color: C.ink }}>បោះបង់</button>
            <PrimaryButton full onClick={submit} disabled={busy}>{busy ? "កំពុងប្តូរ..." : "រក្សាទុក"}</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
