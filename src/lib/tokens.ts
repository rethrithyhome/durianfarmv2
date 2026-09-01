// Color tokens read from CSS custom properties set by applyThemeVars().
// Because these are var() references (not literal hex), switching themes
// via applyThemeVars() instantly updates every component using C.xxx —
// no re-render plumbing needed.
export const C = {
  bg: "var(--c-bg)", bgAlt: "var(--c-bgAlt)", card: "var(--c-card)",
  ink: "var(--c-ink)", inkSoft: "var(--c-inkSoft)",
  green: "var(--c-green)", greenMid: "var(--c-greenMid)",
  gold: "var(--c-gold)", goldDeep: "var(--c-goldDeep)",
  brown: "var(--c-brown)", red: "var(--c-red)", blue: "var(--c-blue)",
  line: "var(--c-line)",
};

/** A translucent tint of a token color, e.g. tint(C.red, 12) for a 12%-opacity wash. */
export function tint(colorVar: string, percent: number): string {
  return `color-mix(in srgb, ${colorVar} ${percent}%, transparent)`;
}

/** Non-color design tokens, also driven by the active theme so switching
 * theme changes shape and depth, not just hue. */
export const R = {
  base: "var(--r-base)",
  lg: "var(--r-lg)",
};
export const SHADOW = {
  card: "var(--shadow-card)",
  float: "var(--shadow-float)",
};
export const FONT = {
  app: "var(--font-app)",
  headingWeight: "var(--font-heading-weight)" as unknown as number,
};
