import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { C, R, SHADOW, tint } from "@/lib/tokens";

type ToastType = "success" | "error" | "info";
interface ToastItem { id: string; type: ToastType; message: string }

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, typeof CheckCircle2> = { success: CheckCircle2, error: XCircle, info: Info };
const COLORS: Record<ToastType, string> = { success: "var(--c-greenMid)", error: "var(--c-red)", info: "var(--c-blue)" };
const DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const push = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, type, message }]);
    const timer = setTimeout(() => dismiss(id), DURATION_MS);
    timers.current.set(id, timer);
  }, [dismiss]);

  const value: ToastContextValue = {
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="fixed left-0 right-0 z-[200] flex flex-col items-center gap-2 px-3 pointer-events-none no-print"
          style={{ bottom: "max(5.5rem, calc(env(safe-area-inset-bottom) + 5rem))" }}
        >
          {items.map((t) => {
            const Icon = ICONS[t.type];
            return (
              <div
                key={t.id}
                onClick={() => dismiss(t.id)}
                className="pointer-events-auto w-full max-w-sm flex items-start gap-2.5 px-4 py-3 rise"
                style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: R.base, boxShadow: SHADOW.float }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: tint(COLORS[t.type], 15) }}>
                  <Icon size={14} color={COLORS[t.type]} />
                </div>
                <div className="flex-1 text-xs leading-relaxed" style={{ color: C.ink }}>{t.message}</div>
                <X size={14} color={C.inkSoft} className="shrink-0 mt-0.5" />
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
