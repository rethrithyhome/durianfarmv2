import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as api from "@/api";
import { C, tint } from "@/lib/tokens";
import { inputCls, inputStyle } from "@/components/ui/primitives";
import { errorMessage } from "@/lib/errors";

export function DangerSection() {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = async () => {
    if (typed.trim() !== "លុប") { setError('សូមវាយពាក្យ "លុប" ដើម្បីបញ្ជាក់'); return; }
    setBusy(true); setError("");
    try {
      await api.resetFarmData();
      await queryClient.invalidateQueries();
      setConfirming(false); setTyped("");
    } catch (err) {
      setError(errorMessage(err));
    } finally { setBusy(false); }
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: tint(C.red, 5), border: `1px solid ${tint(C.red, 20)}` }}>
      <div className="text-[11px] mb-3" style={{ color: C.inkSoft }}>
        លុបទិន្នន័យប្រតិបត្តិការទាំងអស់ (កម្មករ, ដើម, ចំណាយ, ការលក់) — មិនប៉ះពាល់គណនីអ្នកប្រើប្រាស់ទេ
      </div>
      {!confirming ? (
        <button onClick={() => setConfirming(true)} className="text-xs font-semibold" style={{ color: C.red }}>លុបទិន្នន័យទាំងអស់...</button>
      ) : (
        <div>
          <div className="text-[11px] mb-2" style={{ color: C.brown }}>
            វាយពាក្យ <b>លុប</b> ខាងក្រោម ដើម្បីបញ្ជាក់ — សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ
          </div>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} className={inputCls} style={{ ...inputStyle, marginBottom: 10 }} placeholder="លុប" />
          {error && <div className="text-[11px] mb-2" style={{ color: C.red }}>{error}</div>}
          <div className="flex gap-2">
            <button onClick={() => { setConfirming(false); setTyped(""); setError(""); }} className="flex-1 rounded-xl py-2 text-xs font-semibold" style={{ background: C.bgAlt, color: C.ink }}>បោះបង់</button>
            <button onClick={reset} disabled={busy} className="flex-1 rounded-xl py-2 text-xs font-semibold disabled:opacity-60" style={{ background: C.red, color: "#fff" }}>{busy ? "កំពុងលុប..." : "បញ្ជាក់ការលុប"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
