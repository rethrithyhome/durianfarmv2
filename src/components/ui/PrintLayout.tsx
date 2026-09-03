import { fmtDate, todayISO } from "@/lib/format";
import { C } from "@/lib/tokens";
import { DurianMark } from "@/components/ui/DurianMark";

/**
 * Standard letterhead for every printable report — same logo placement,
 * farm name, report title, and date line everywhere, so printed pages
 * read as one consistent set of company documents rather than each
 * report inventing its own layout.
 */
export function PrintHeader({
  farmName, farmLogo, title, subtitle, count,
}: {
  farmName?: string | null;
  farmLogo?: string | null;
  title: string;
  subtitle?: string;
  count?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5 pb-4" style={{ borderBottom: `2px solid ${C.green}` }}>
      {farmLogo ? (
        <img src={farmLogo} alt="logo" className="w-12 h-12 rounded-full object-cover shrink-0" />
      ) : (
        <DurianMark size={44} />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-base font-bold" style={{ color: C.green }}>{farmName || "ចម្ការទុរេន"}</div>
        <div className="text-sm font-semibold mt-0.5" style={{ color: C.ink }}>{title}</div>
        {subtitle && <div className="text-[11px] mt-0.5" style={{ color: C.inkSoft }}>{subtitle}</div>}
      </div>
      <div className="text-right shrink-0">
        <div className="text-[10.5px]" style={{ color: C.inkSoft }}>ចេញកាលបរិច្ឆេទ</div>
        <div className="text-[11px] font-medium" style={{ color: C.ink }}>{fmtDate(todayISO())}</div>
        {count && <div className="text-[10.5px] mt-1" style={{ color: C.inkSoft }}>{count}</div>}
      </div>
    </div>
  );
}

/** Standard signature block — same two-column layout at the bottom of
 * every report that needs sign-off (payroll, expenses, worker roster). */
export function PrintFooter() {
  return (
    <div className="grid grid-cols-2 gap-8 mt-10 text-[11px]" style={{ color: C.inkSoft }}>
      <div>
        <div className="mb-10">អ្នករៀបចំ</div>
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 4 }}>ហត្ថលេខា និងឈ្មោះ</div>
      </div>
      <div>
        <div className="mb-10">អ្នកអនុម័ត</div>
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 4 }}>ហត្ថលេខា និងឈ្មោះ</div>
      </div>
    </div>
  );
}
