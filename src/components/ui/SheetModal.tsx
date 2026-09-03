import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { C, R, SHADOW } from "@/lib/tokens";

export function SheetModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0" style={{ background: "rgba(20,26,18,0.45)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[88vh] overflow-y-auto" style={{ background: C.card, boxShadow: SHADOW.float, borderTopLeftRadius: R.lg, borderTopRightRadius: R.lg, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <div className="flex justify-center pt-2.5 sm:hidden"><div className="w-10 h-1 rounded-full" style={{ background: C.line }} /></div>
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b" style={{ background: C.card, borderColor: C.line }}>
          <h3 className="font-bold text-base" style={{ color: C.green }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: C.bgAlt }}><X size={18} color={C.ink} /></button>
        </div>
        <div className="p-5" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
