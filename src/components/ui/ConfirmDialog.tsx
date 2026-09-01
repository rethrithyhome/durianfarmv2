import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { SheetModal } from "./SheetModal";
import { PrimaryButton } from "./primitives";
import { C, tint } from "@/lib/tokens";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type Resolver = (ok: boolean) => void;

const ConfirmContext = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ opts: ConfirmOptions; resolve: Resolver } | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => setState({ opts, resolve }));
  }, []);

  const close = (ok: boolean) => {
    state?.resolve(ok);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <SheetModal title={state.opts.title} onClose={() => close(false)}>
          <div className="flex gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint(state.opts.danger ? C.red : C.goldDeep, 12) }}>
              <AlertTriangle size={18} color={state.opts.danger ? C.red : C.goldDeep} />
            </div>
            <p className="text-xs leading-relaxed pt-1.5" style={{ color: C.inkSoft }}>{state.opts.message}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => close(false)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{ background: C.bgAlt, color: C.ink }}>
              {state.opts.cancelLabel ?? "បោះបង់"}
            </button>
            <PrimaryButton full danger={state.opts.danger} onClick={() => close(true)}>
              {state.opts.confirmLabel ?? "បញ្ជាក់"}
            </PrimaryButton>
          </div>
        </SheetModal>
      )}
    </ConfirmContext.Provider>
  );
}

/**
 * Returns an async confirm() that resolves true only if the person
 * explicitly confirms — so destructive actions read as a normal
 * `if (await confirm(...))` guard at the call site.
 */
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
