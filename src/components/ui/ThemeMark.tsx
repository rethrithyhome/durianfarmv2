import { C } from "@/lib/tokens";
import type { MarkStyle } from "@/lib/theme";

/**
 * A small decorative mark whose shape changes with the active theme.
 * Used where a compact accent is wanted (section headers, empty states,
 * theme previews) rather than the farm's full photographic logo.
 */
export function ThemeMark({ style, size = 32, primary, accent }: { style: MarkStyle; size?: number; primary?: string; accent?: string }) {
  const p = primary ?? C.green;
  const a = accent ?? C.gold;

  if (style === "hex") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
        <polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill={p} />
        <polygon points="50,24 72,37 72,63 50,76 28,63 28,37" fill={a} opacity="0.9" />
        <path d="M50 34 L50 66 M38 44 L50 52 L62 44" stroke={p} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (style === "sprout") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
        <rect x="18" y="62" width="64" height="30" rx="8" fill={p} />
        <path d="M50 62 L50 30" stroke={a} strokeWidth="7" strokeLinecap="round" />
        <path d="M50 40 C34 40 26 30 26 20 C40 20 50 28 50 40 Z" fill={a} />
        <path d="M50 46 C66 46 74 36 74 26 C60 26 50 34 50 46 Z" fill={p} opacity="0.85" />
      </svg>
    );
  }

  if (style === "circle") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="42" fill={a} opacity="0.35" />
        <circle cx="50" cy="50" r="30" fill={p} />
        <circle cx="50" cy="50" r="13" fill={a} />
      </svg>
    );
  }

  // leaf (default)
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="44" fill={a} opacity="0.28" />
      <path d="M50 14 C74 26 82 52 66 74 C58 85 46 88 38 84 C30 62 32 34 50 14 Z" fill={p} />
      <path d="M50 20 C48 44 44 66 42 82" stroke={a} strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
