import { C } from "@/lib/tokens";

/** Base pulsing block — the building piece every skeleton shape is made from. */
function Bone({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton-pulse ${className}`} style={{ background: C.line, borderRadius: 6, ...style }} />;
}

/** Mimics a StatCard — used on Home and other dashboards while their numbers load. */
export function SkeletonStatCard() {
  return (
    <div className="relative p-3.5 overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: "var(--r-lg)" }}>
      <Bone className="h-2.5 w-16 mb-2" />
      <Bone className="h-6 w-12 mb-1.5" />
      <Bone className="h-2 w-20" />
    </div>
  );
}

/** Mimics a row-style list item (avatar/icon + two lines + trailing bit) —
 * used for workers, expenses, sales, payroll rows, etc. */
export function SkeletonRow({ avatar = true }: { avatar?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      {avatar && <Bone className="w-10 h-10 shrink-0" style={{ borderRadius: 999 }} />}
      <div className="flex-1 min-w-0">
        <Bone className="h-3 w-2/3 mb-2" />
        <Bone className="h-2.5 w-1/3" />
      </div>
      <Bone className="h-4 w-14 shrink-0" />
    </div>
  );
}

/** A stack of SkeletonRows, for a whole list while it's loading. */
export function SkeletonList({ count = 4, avatar = true }: { count?: number; avatar?: boolean }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} avatar={avatar} />)}
    </div>
  );
}

/** A grid of SkeletonStatCards, for dashboards while their stats load. */
export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => <SkeletonStatCard key={i} />)}
    </div>
  );
}

/** Mimics a tall card block (charts, financial summaries) while it loads. */
export function SkeletonBlock({ height = 180 }: { height?: number }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <Bone className="h-3 w-1/3 mb-3" />
      <Bone style={{ height, borderRadius: 12 }} />
    </div>
  );
}
