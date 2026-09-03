export interface ThemeColors {
  bg: string; bgAlt: string; card: string; ink: string; inkSoft: string;
  green: string; greenMid: string; gold: string; goldDeep: string;
  brown: string; red: string; blue: string; line: string;
}

/** A theme is a complete design preset, not just a palette — it also
 * carries typography, corner rounding, shadow depth and a decorative
 * mark, so switching theme visibly changes the personality of the UI. */
export interface ThemeDef {
  key: string;
  label: string;
  tagline: string;
  swatch: [string, string, string];
  colors: ThemeColors;
  colorsDark: ThemeColors;
  font: string;          // CSS font-family stack
  fontUrl: string;       // Google Fonts URL to load on demand
  headingWeight: number;
  radius: string;        // base corner radius for cards/controls
  radiusLg: string;      // larger radius for sheets/hero cards
  shadow: string;        // resting elevation for cards
  shadowLg: string;      // elevation for floating surfaces
  mark: MarkStyle;       // decorative logo treatment
}

export type MarkStyle = "leaf" | "circle" | "hex" | "sprout";

const KANTUMRUY = "https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700;800&display=swap";
const NOTO = "https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;500;600;700;800&display=swap";
const BATTAMBANG = "https://fonts.googleapis.com/css2?family=Battambang:wght@400;700;900&display=swap";
const MOULPALI = "https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@300;400;600;700&display=swap";

export const THEMES: Record<string, ThemeDef> = {
  // Clean and contemporary — soft cream, deep leaf green, generous curves.
  durian: {
    key: "durian",
    label: "ស្លឹកទុរេន",
    tagline: "ទំនើប ស្រាល រលោង",
    swatch: ["#1F3A2E", "#3D6B4F", "#D9A441"],
    colors: {
      bg: "#F7F3E7", bgAlt: "#EFE7D3", card: "#FFFFFF", ink: "#28321F", inkSoft: "#5B6650",
      green: "#1F3A2E", greenMid: "#3D6B4F", gold: "#D9A441", goldDeep: "#B9832C",
      brown: "#6B4A2F", red: "#B54B3A", blue: "#3E7C8C", line: "#E3D9BE",
    },
    colorsDark: {
      bg: "#12160F", bgAlt: "#1A2016", card: "#1F2A1B", ink: "#F1F4EC", inkSoft: "#A9B79E",
      green: "#6FCF97", greenMid: "#4E9A6C", gold: "#E8BE6C", goldDeep: "#D9A441",
      brown: "#B08968", red: "#E0685A", blue: "#6FB2C4", line: "#2C362A",
    },
    font: "'Kantumruy Pro', sans-serif", fontUrl: KANTUMRUY, headingWeight: 800,
    radius: "1rem", radiusLg: "1.5rem",
    shadow: "0 1px 2px rgba(31,58,46,0.06)", shadowLg: "0 8px 30px rgba(31,58,46,0.16)",
    mark: "leaf",
  },

  // Crisp and structured — cooler greens, tighter corners, flatter surfaces.
  forest: {
    key: "forest",
    label: "ព្រៃស្លឹកឈើ",
    tagline: "ច្បាស់លាស់ រឹងមាំ",
    swatch: ["#14312A", "#2F6B57", "#9CB380"],
    colors: {
      bg: "#F2F6F2", bgAlt: "#E3ECE5", card: "#FFFFFF", ink: "#16241E", inkSoft: "#4E6157",
      green: "#14312A", greenMid: "#2F6B57", gold: "#9CB380", goldDeep: "#6E8B57",
      brown: "#54402C", red: "#A3453A", blue: "#3D6E75", line: "#D3E0D6",
    },
    colorsDark: {
      bg: "#0E1512", bgAlt: "#161F1A", card: "#1B2620", ink: "#EDF3EE", inkSoft: "#9DB0A4",
      green: "#6FCB9F", greenMid: "#4C9E77", gold: "#C9D6A8", goldDeep: "#9CB380",
      brown: "#A98B6E", red: "#D97E70", blue: "#6FA8AE", line: "#25322B",
    },
    font: "'Noto Sans Khmer', sans-serif", fontUrl: NOTO, headingWeight: 700,
    radius: "0.6rem", radiusLg: "0.9rem",
    shadow: "0 1px 1px rgba(20,49,42,0.05)", shadowLg: "0 6px 20px rgba(20,49,42,0.14)",
    mark: "hex",
  },

  // Warm and grounded — earthy browns and terracotta, heavier type.
  soil: {
    key: "soil",
    label: "ដីស្រែ",
    tagline: "ក្តៅ ស្និទ្ធស្នាល",
    swatch: ["#4A361E", "#8A5A34", "#D4923E"],
    colors: {
      bg: "#FAF1E5", bgAlt: "#F0E1CB", card: "#FFFDFA", ink: "#3A281A", inkSoft: "#6F5844",
      green: "#4A361E", greenMid: "#8A5A34", gold: "#D4923E", goldDeep: "#B07129",
      brown: "#784828", red: "#B24428", blue: "#607E6E", line: "#E7D2B8",
    },
    colorsDark: {
      bg: "#171009", bgAlt: "#20160D", card: "#271C11", ink: "#F5ECDE", inkSoft: "#C2A98A",
      green: "#E0A85E", greenMid: "#C08847", gold: "#E8B563", goldDeep: "#D4923E",
      brown: "#B98657", red: "#DE7A5C", blue: "#8FAFA0", line: "#382A1A",
    },
    font: "'Battambang', serif", fontUrl: BATTAMBANG, headingWeight: 900,
    radius: "0.85rem", radiusLg: "1.25rem",
    shadow: "0 2px 4px rgba(74,54,30,0.08)", shadowLg: "0 10px 28px rgba(74,54,30,0.20)",
    mark: "sprout",
  },

  // Airy and minimal — pale sunrise tones, light type, soft rounded shapes.
  sunset: {
    key: "sunset",
    label: "ថ្ងៃរះលើចំការ",
    tagline: "ស្រាល ភ្លឺ ស្ងប់",
    swatch: ["#7A4A2F", "#C97A45", "#F0B76B"],
    colors: {
      bg: "#FFF8F0", bgAlt: "#FBEADA", card: "#FFFFFF", ink: "#3B2618", inkSoft: "#7C5C46",
      green: "#7A4A2F", greenMid: "#C97A45", gold: "#F0B76B", goldDeep: "#CE8C39",
      brown: "#6B3C23", red: "#C4543F", blue: "#6E7F92", line: "#F3DCC6",
    },
    colorsDark: {
      bg: "#1A120B", bgAlt: "#241810", card: "#2C1D13", ink: "#FBEFE0", inkSoft: "#D2B79C",
      green: "#E9986A", greenMid: "#D97E4E", gold: "#F5C989", goldDeep: "#F0B76B",
      brown: "#C08F63", red: "#E27C63", blue: "#9BA6C0", line: "#3A2A1C",
    },
    font: "'Kantumruy Pro', sans-serif", fontUrl: MOULPALI, headingWeight: 600,
    radius: "1.35rem", radiusLg: "2rem",
    shadow: "0 1px 3px rgba(122,74,47,0.07)", shadowLg: "0 12px 34px rgba(122,74,47,0.15)",
    mark: "circle",
  },
};

export const DEFAULT_THEME = "durian";

const loadedFonts = new Set<string>();
function ensureFont(url: string) {
  if (loadedFonts.has(url)) return;
  loadedFonts.add(url);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
}

/** Applies a theme by writing CSS custom properties, so every component
 * reading from `C` / `--r-*` updates instantly without re-rendering. */
export function applyThemeVars(themeKey: string, dark = false) {
  const t = THEMES[themeKey] ?? THEMES[DEFAULT_THEME];
  const palette = dark ? t.colorsDark : t.colors;
  const root = document.documentElement;
  (Object.keys(palette) as (keyof ThemeColors)[]).forEach((k) => {
    root.style.setProperty(`--c-${k}`, palette[k]);
  });
  ensureFont(t.fontUrl);
  root.style.setProperty("--font-app", t.font);
  root.style.setProperty("--font-heading-weight", String(t.headingWeight));
  root.style.setProperty("--r-base", t.radius);
  root.style.setProperty("--r-lg", t.radiusLg);
  root.style.setProperty("--shadow-card", t.shadow);
  root.style.setProperty("--shadow-float", t.shadowLg);
  root.style.setProperty("color-scheme", dark ? "dark" : "light");
}

export function themeDef(key: string): ThemeDef {
  return THEMES[key] ?? THEMES[DEFAULT_THEME];
}
