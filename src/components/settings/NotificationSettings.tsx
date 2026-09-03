import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { enablePush, disablePush, isPushEnabled, pushSupported, getPushPermissionState } from "@/lib/push";
import { errorMessage } from "@/lib/errors";
import { C, tint } from "@/lib/tokens";

export function NotificationSettings() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    isPushEnabled().then(setEnabled);
    getPushPermissionState().then(setPermission);
  }, []);

  const toggle = async () => {
    setBusy(true); setError("");
    try {
      if (enabled) { await disablePush(); setEnabled(false); }
      else { await enablePush(); setEnabled(true); }
      setPermission(await getPushPermissionState());
    } catch (err) {
      setError(errorMessage(err));
    } finally { setBusy(false); }
  };

  if (!pushSupported()) {
    return (
      <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-[11px]" style={{ color: C.inkSoft }}>ឧបករណ៍/browser នេះមិនគាំទ្រការជូនដំណឹងទេ</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint(C.goldDeep, 12) }}>
            {enabled ? <Bell size={16} color={C.goldDeep} /> : <BellOff size={16} color={C.goldDeep} />}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: C.green }}>ការជូនដំណឹង</div>
            <div className="text-[11px]" style={{ color: C.inkSoft }}>ការងារថ្មីចាត់តាំងឲ្យអ្នក នឹងជូនដំណឹងទៅឧបករណ៍នេះ</div>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={busy || permission === "denied"}
          className="relative w-12 h-7 rounded-full shrink-0 disabled:opacity-50"
          style={{ background: enabled ? C.greenMid : C.line }}
        >
          <span className="absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform" style={{ left: 2, transform: enabled ? "translateX(20px)" : "translateX(0)", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
        </button>
      </div>
      {permission === "denied" && (
        <div className="text-[10.5px] mt-2" style={{ color: C.red }}>ការជូនដំណឹងត្រូវបានទប់ស្កាត់ក្នុង browser — សូមអនុញ្ញាតតាមរយៈការកំណត់ browser ផ្ទាល់</div>
      )}
      {error && <div className="text-[10.5px] mt-2" style={{ color: C.red }}>{error}</div>}
    </div>
  );
}
