export interface ThemeColors {
  bg: string; bgAlt: string; card: string; ink: string; inkSoft: string;
  green: string; greenMid: string; gold: string; goldDeep: string;
  brown: string; red: string; blue: string; line: string;
}
export interface ThemeDef { key: string; label: string; swatch: [string, string]; colors: ThemeColors }

// Classic, natural palettes — warm cream backgrounds, deep leaf/forest
// greens as the primary color, durian-gold accents. Grounded and earthy
// rather than saturated/neon.
export const THEMES: Record<string, ThemeDef> = {
  durian: {
    key: "durian", label: "ស្លឹកទុរេន", swatch: ["#1F3A2E", "#D9A441"],
    colors: {
      bg: "#F7F3E7", bgAlt: "#EFE7D3", card: "#FFFFFF", ink: "#28321F", inkSoft: "#5B6650",
      green: "#1F3A2E", greenMid: "#3D6B4F", gold: "#D9A441", goldDeep: "#B9832C",
      brown: "#6B4A2F", red: "#B54B3A", blue: "#3E7C8C", line: "#E3D9BE",
    },
  },
  forest: {
    key: "forest", label: "ព្រៃស្លឹកឈើ", swatch: ["#1A3621", "#A89B4A"],
    colors: {
      bg: "#F0F4EB", bgAlt: "#E3EBD9", card: "#FFFFFF", ink: "#1E2A1A", inkSoft: "#52614A",
      green: "#1A3621", greenMid: "#3A5E35", gold: "#A89B4A", goldDeep: "#8A7C35",
      brown: "#5A3F29", red: "#A54234", blue: "#446E66", line: "#D6E0CA",
    },
  },
  soil: {
    key: "soil", label: "ដីស្រែ", swatch: ["#4A361E", "#D4923E"],
    colors: {
      bg: "#FAF1E5", bgAlt: "#F0E1CB", card: "#FFFFFF", ink: "#3A281A", inkSoft: "#6F5844",
      green: "#4A361E", greenMid: "#8A5A34", gold: "#D4923E", goldDeep: "#B07129",
      brown: "#784828", red: "#B24428", blue: "#607E6E", line: "#E7D2B8",
    },
  },
  sunset: {
    key: "sunset", label: "ថ្ងៃលិចលើចំការ", swatch: ["#5C2D21", "#E8A34A"],
    colors: {
      bg: "#FDF0E3", bgAlt: "#F7DEC4", card: "#FFFFFF", ink: "#3D231A", inkSoft: "#785040",
      green: "#5C2D21", greenMid: "#B55A35", gold: "#E8A34A", goldDeep: "#C77C2D",
      brown: "#6B3C23", red: "#B23A2D", blue: "#6F6185", line: "#F0CFB2",
    },
  },
};

export const DEFAULT_THEME = "durian";

export function applyThemeVars(themeKey: string) {
  const t = THEMES[themeKey] ?? THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  (Object.keys(t.colors) as (keyof ThemeColors)[]).forEach((k) => {
    root.style.setProperty(`--c-${k}`, t.colors[k]);
  });
}
