import { useState } from "react";
import * as api from "@/api";
import { C } from "@/lib/tokens";
import { DurianMark } from "@/components/ui/DurianMark";
import { Field, PrimaryButton, inputCls, inputStyle } from "@/components/ui/primitives";
import { errorMessage } from "@/lib/errors";

export function LoginPage({ farmName, logo }: { farmName?: string; logo?: string | null }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async () => {
    setError(""); setInfo("");
    if (!email.trim() || !password.trim()) { setError("សូមបញ្ចូល email និង password"); return; }
    if (mode === "signup" && !name.trim()) { setError("សូមបញ្ចូលឈ្មោះ"); return; }
    setBusy(true);
    try {
      if (mode === "signin") {
        await api.signIn(email.trim(), password);
      } else {
        await api.signUp(email.trim(), password, name.trim());
        setInfo("បង្កើតគណនីជោគជ័យ! សូមពិនិត្យអ៊ីមែលរបស់អ្នក ដើម្បីបញ្ជាក់ (confirm) គណនី មុននឹងអាចចូលប្រើបាន។");
        setMode("signin");
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: C.bg }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          {logo ? <img src={logo} alt="logo" className="w-16 h-16 rounded-2xl object-cover mb-2" /> : <DurianMark size={64} />}
          <div className="font-extrabold text-base mt-2" style={{ color: C.green }}>{farmName || "ចំការទុរេនរបស់ខ្ញុំ"}</div>
          <div className="text-xs" style={{ color: C.inkSoft }}>{mode === "signin" ? "ចូលប្រើប្រព័ន្ធគ្រប់គ្រងចំការ" : "បង្កើតគណនីថ្មី"}</div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          {mode === "signup" && (
            <Field label="ឈ្មោះពេញ *"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={inputStyle} placeholder="ឈ្មោះរបស់អ្នក" /></Field>
          )}
          <Field label="អ៊ីមែល *"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} style={inputStyle} placeholder="you@example.com" autoCapitalize="none" /></Field>
          <Field label="ពាក្យសម្ងាត់ *"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} style={inputStyle} placeholder="យ៉ាងតិច ៦ តួអក្សរ" /></Field>

          {error && <div className="rounded-xl px-3 py-2.5 text-[11px] mb-4" style={{ background: `color-mix(in srgb, ${C.red} 12%, transparent)`, color: C.red }}>{error}</div>}
          {info && <div className="rounded-xl px-3 py-2.5 text-[11px] mb-4" style={{ background: `color-mix(in srgb, ${C.greenMid} 12%, transparent)`, color: C.greenMid }}>{info}</div>}

          <PrimaryButton full onClick={submit} disabled={busy}>{busy ? "កំពុងដំណើរការ..." : mode === "signin" ? "ចូលប្រើប្រព័ន្ធ" : "បង្កើតគណនី"}</PrimaryButton>

          <button
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setInfo(""); }}
            className="w-full text-center text-xs font-medium mt-4"
            style={{ color: C.greenMid }}
          >
            {mode === "signin" ? "មិនទាន់មានគណនី? បង្កើតថ្មី" : "មានគណនីរួចហើយ? ចូលប្រើ"}
          </button>
        </div>

        <div className="text-[10.5px] text-center mt-4" style={{ color: C.inkSoft }}>
          បន្ទាប់ពីបង្កើតគណនីដំបូងគេ សូមចូល Supabase Dashboard → Table Editor → profiles
          ដើម្បីកំណត់ role ជា &quot;owner&quot; និង farm_id ឲ្យខ្លួនឯង
        </div>
      </div>
    </div>
  );
}
