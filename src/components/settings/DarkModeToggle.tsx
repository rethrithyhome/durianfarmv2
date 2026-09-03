import { Moon, Sun } from "lucide-react";
import { useDarkMode } from "@/contexts/DarkModeContext";
import { C, tint } from "@/lib/tokens";

export function DarkModeToggle() {
  const { dark, toggle } = useDarkMode();
  return (
    <div className="rounded-2xl p-4 mb-3 flex items-center justify-between" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint(C.goldDeep, 12) }}>
          {dark ? <Moon size={16} color={C.goldDeep} /> : <Sun size={16} color={C.goldDeep} />}
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: C.green }}>ពន្លឺងងឹត (Dark Mode)</div>
          <div className="text-[11px]" style={{ color: C.inkSoft }}>សម្រាប់ពេលយប់ ឬពន្លឺខ្លាំង — កំណត់ចំពោះឧបករណ៍នេះប៉ុណ្ណោះ</div>
        </div>
      </div>
      <button
        onClick={toggle}
        className="relative w-12 h-7 rounded-full shrink-0"
        style={{ background: dark ? C.greenMid : C.line }}
      >
        <span
          className="absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform"
          style={{ left: 2, transform: dark ? "translateX(20px)" : "translateX(0)", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
        />
      </button>
    </div>
  );
}
