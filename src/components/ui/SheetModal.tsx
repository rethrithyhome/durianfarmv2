import type { ReactNode } from "react";
import { X } from "lucide-react";
import { C } from "@/lib/tokens";

export function SheetModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0" style={{ background: "rgba(20,26,18,0.45)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-y-auto" style={{ background: C.card, boxShadow: "0 -8px 40px rgba(0,0,0,0.18)" }}>
        <div className="flex justify-center pt-2.5 sm:hidden"><div className="w-10 h-1 rounded-full" style={{ background: C.line }} /></div>
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b" style={{ background: C.card, borderColor: C.line }}>
          <h3 className="font-bold text-base" style={{ color: C.green }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: C.bgAlt }}><X size={18} color={C.ink} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
