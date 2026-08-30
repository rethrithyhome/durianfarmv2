import { C } from "@/lib/tokens";

export function DurianMark({ size = 36 }: { size?: number }) {
  const spikes = 14;
  const cx = 50, cy = 54, r = 30;
  const paths: string[] = [];
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2;
    const bx = cx + r * Math.cos(a), by = cy + r * Math.sin(a);
    const tx = cx + (r + 11) * Math.cos(a), ty = cy + (r + 11) * Math.sin(a);
    const a2 = a + ((Math.PI * 2) / spikes) / 2.6;
    const b2x = cx + r * Math.cos(a2), b2y = cy + r * Math.sin(a2);
    paths.push(`M${bx},${by} L${tx},${ty} L${b2x},${b2y} Z`);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={r} fill={C.gold} />
      {paths.map((d, i) => <path key={i} d={d} fill={C.greenMid} />)}
      <path d="M50 20 Q46 10 38 8 M50 20 Q54 10 62 8" stroke={C.brown} strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
