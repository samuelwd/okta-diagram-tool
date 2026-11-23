// The palette: named colours with where each came from. Themes (system/themes/*.css) use
// these values; the specimen and docs/DESIGN-SYSTEM.md list them.
export type Swatch = { name: string; hex: string; use: string };
export type Group = { group: string; source: string; swatches: Swatch[] };

export const PALETTE: Group[] = [
  {
    group: "Okta blues",
    source: "Athletics case study for Okta (athleticsnyc.com/work/okta)",
    swatches: [
      { name: "cobalt", hex: "#1A31A9", use: "canvas start, chips, tags, section headings" },
      { name: "blue", hex: "#3F59E4", use: "canvas middle, icons, first stacked layer" },
      { name: "periwinkle", hex: "#B6C9FF", use: "card and canvas layers, log lines" },
    ],
  },
  {
    group: "Creams and ink",
    source: "Athletics case study for Okta",
    swatches: [
      { name: "card", hex: "#FFFEFA", use: "card fill, text on the canvas" },
      { name: "page", hex: "#F6F1E7", use: "page background" },
      { name: "rule", hex: "#E8DCC7", use: "rules, plain lines" },
      { name: "ink", hex: "#191919", use: "card titles" },
      { name: "muted", hex: "#6B665F", use: "muted text" },
      { name: "stone", hex: "#AFABA1", use: "lines on cream" },
    ],
  },
  {
    group: "Teals",
    source: "Athletics case study for Okta (not used yet)",
    swatches: [
      { name: "dark teal", hex: "#096256", use: "" },
      { name: "teal", hex: "#4CB7A3", use: "" },
      { name: "light teal", hex: "#B1E4DE", use: "" },
    ],
  },
  {
    group: "Blue theme lines",
    source: "chosen for contrast on cobalt (brand colours were overused)",
    swatches: [
      { name: "mint", hex: "#7CF2D6", use: "req" },
      { name: "gold", hex: "#FFD43B", use: "cfg" },
      { name: "pink", hex: "#FF8FB8", use: "attr" },
      { name: "periwinkle", hex: "#B6C9FF", use: "log, dashed" },
      { name: "peach", hex: "#FFB08A", use: "warn, dotted" },
    ],
  },
  {
    group: "Gradient theme",
    source: "okta.com stylesheets, 21 Nov 2026",
    swatches: [
      { name: "navy", hex: "#0B1477", use: "canvas" },
      { name: "royal", hex: "#1626B8", use: "canvas" },
      { name: "electric", hex: "#2A3CF2", use: "glow, hub" },
      { name: "coral", hex: "#FF6217", use: "glow (okta.com)" },
      { name: "violet", hex: "#9921FE", use: "glow (okta.com)" },
      { name: "orange", hex: "#FF8A4C", use: "cfg" },
      { name: "mint", hex: "#6FF0D2", use: "attr" },
      { name: "white", hex: "#FFFFFF", use: "req, text" },
    ],
  },
];
