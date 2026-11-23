// Builds the visual style reference, one page per theme, from the same theme CSS,
// icon set and renderer the diagrams use:
//
//   bun scripts/specimen.ts      -> out/specimen/<theme>.html
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_TOKENS,
  ICONS,
  KINDS,
  PALETTE,
  THEMES,
  TYPE,
  icon,
  renderHtml,
  type Spec,
  type Theme,
} from "okta-diagram-tool";

const ROOT = join(import.meta.dir, "..");

// Every component on one canvas, drawn by the renderer itself.
const components: Spec = {
  title: "Components",
  description:
    "Every diagram component: zones, cards, chips, tags, line kinds, steps, the side panel and the key.",
  canvas: { x: 0, y: -100, w: 1500, h: 1120 },
  heading: "Components",
  zones: [
    { x: 24, y: -40, w: 1060, h: 380, label: "Zone label, top left (sentence case)" },
    { x: 24, y: 360, w: 1060, h: 340, label: "Zone label, bottom right", at: "br" },
    { x: 24, y: 762, w: 520, h: 170, label: "Stage label above a solid zone", style: "solid", at: "above" },
  ],
  boxes: [
    {
      id: "card",
      x: 48,
      y: 10,
      w: 300,
      title: "Card title",
      text: "Card text wraps to the card. Plain verbs, present tense.",
      icon: "server",
    },
    {
      id: "chip",
      x: 380,
      y: 10,
      w: 300,
      title: "Pill and tag",
      text: "A pill on the top edge, a pattern tag top-right.",
      icon: "key-round",
      role: "PDP · PEP",
      tag: "AP1",
    },
    {
      id: "hub",
      x: 712,
      y: 10,
      w: 340,
      title: "Hub card (use sparingly)",
      text: "Prefer arrows to show importance over a highlighted card.",
      hub: true,
      icon: "scale",
    },
    {
      id: "list",
      x: 48,
      y: 150,
      w: 300,
      title: "Icon list",
      text: "One or more of the following",
      items: [
        { icon: "file-code", text: "XACML" },
        { icon: "opa", text: "OPA (Rego)" },
        { icon: "cedar", text: "Cedar" },
      ],
    },
    {
      id: "brcorner",
      x: 380,
      y: 150,
      w: 300,
      h: 110,
      title: "Icon bottom right",
      text: ["When the top-right corner", "is taken by a line"],
      icon: "database",
      iconAt: "br",
    },
    {
      id: "note",
      x: 712,
      y: 150,
      w: 340,
      title: "Card with a note",
      text: "A small italic line closes the card.",
      note: "adds claims at token issue (optional)",
      icon: "webhook",
    },
    {
      id: "okta",
      x: 48,
      y: 400,
      w: 320,
      logo: "okta-wordmark",
      role: "IdP",
      sections: [
        {
          icon: "okta-sign-in",
          heading: "Product section",
          items: [
            { text: "Item with a role", role: "PDP · PEP" },
            { text: "Item with another", role: "PIP" },
          ],
        },
        { icon: "okta-directory", heading: "Universal Directory", items: ["Plain item"] },
      ],
    },
    {
      id: "pills",
      x: 44,
      y: 780,
      w: 236,
      title: "Pills by meaning",
      align: "center",
      pillCols: 2,
      pills: [
        { text: "Accent" },
        { text: "Neutral", tone: "neutral" },
        { text: "Allow", tone: "allow" },
        { text: "Caution", tone: "caution" },
        { text: "Deny", tone: "deny" },
      ],
    },
    {
      id: "openinv",
      x: 310,
      y: 784,
      w: 210,
      variant: "open",
      inverse: true,
      align: "center",
      icon: "user",
      iconSize: 40,
      text: ["Open card on", "a solid zone"],
    },
    {
      id: "open",
      x: 600,
      y: 740,
      w: 240,
      variant: "open",
      icon: "users",
      title: "Open card",
      text: ["A large icon and a title", "Bullets, no card around it"],
      bullets: true,
    },
    {
      id: "band",
      x: 24,
      y: 960,
      w: 1060,
      variant: "band",
      icon: "settings",
      title: "Band",
      text: "a rounded strip with an icon, a bold title and text on one line",
    },
    { id: "a", x: 430, y: 420, w: 180, h: 80, title: "Source" },
    { id: "b", x: 860, y: 420, w: 180, h: 80, title: "Target" },
  ],
  arrows: [
    {
      kind: "req",
      points: ["a.right@20", "b.left@20"],
      label: { text: "request path (req)" },
      steps: [{ n: 1, at: [636, 440] }],
    },
    {
      kind: "cfg",
      points: ["a.right@60", "b.left@60"],
      label: { text: "configuration (cfg)", at: [735, 472] },
    },
    {
      kind: "attr",
      points: ["a.bottom@40", [470, 660], [900, 660], "b.bottom@40"],
      label: { text: "attributes and identity data (attr)", at: [685, 652] },
      steps: [{ n: 2, at: [560, 660] }],
    },
    {
      kind: "log",
      points: ["a.bottom@140", [570, 590], "b.bottom@140"],
      label: { text: "logs and audit (log)", at: [785, 582] },
    },
    {
      kind: "warn",
      points: [
        [430, 388],
        [620, 388],
      ],
      head: "none",
      label: { text: "missing or at risk (warn)", at: [430, 380], anchor: "start" },
    },
    {
      kind: "plain",
      points: [
        [680, 388],
        [840, 388],
      ],
      head: "both",
      label: { text: "two-way (plain)", at: [760, 380] },
    },
  ],
  sidebar: {
    x: 1110,
    y: -40,
    w: 366,
    h: 740,
    title: "Side panel steps",
    steps: [
      { title: "Step title", text: "One or two short lines say what happens at this step." },
      { title: "Inside a group", text: "A dashed frame groups steps that only some flows take." },
      { title: "Attribute step", text: "Pink marks an attribute lookup.", kind: "attr" },
    ],
    groups: [{ label: "If a condition holds", from: 1, to: 2 }],
  },
  raw: [
    // hand-written SVG: a callout drawn with the theme's classes
    {
      svg: `<g class="raw-callout"><rect x="660" y="540" width="236" height="44" rx="12" fill="none" stroke="currentColor" stroke-opacity=".7" stroke-dasharray="2 4"/><text class="ftext" x="676" y="567">hand-written SVG (raw)</text></g>`,
    },
  ],
  legend: { labels: { role: "Pill", tag: "Pattern tag" } },
};

// Sample text for each type role.
const SAMPLE: Record<keyof typeof TYPE, string> = {
  heading: "Okta secures an API with an authorization server",
  cardTitle: "Orders API",
  cardText: "Okta secures these resources with authorization servers",
  openTitle: "Source identity",
  stageLabel: "1 – JOIN",
  pill: "Attributes",
  sectionHeading: "Context-aware authentication",
  zoneLabel: "Decision service",
  lineLabel: "scopes and claims in the access token",
  panelTitle: "Authorization flow",
  stepTitle: "Token",
  stepText: "The authorization server issues an access token with scopes and claims",
  groupLabel: "Each time the token expires",
  chip: "SSF receiver",
  tag: "AP1",
  stepNumber: "4",
  key: "Request path",
};

function page(theme: Theme): string {
  // Start from a rendered diagram page so the theme CSS is identical, then add the sheet.
  const html = renderHtml({ ...components, title: `Style reference, ${theme}` }, theme);
  const swatches = PALETTE.map(
    (g) =>
      `<h3>${g.group}</h3><p class="note">${g.source}</p><div class="sw">${g.swatches
        .map(
          (w) =>
            `<div class="s"><div class="chip" style="background:${w.hex}"></div><code>${w.hex}</code><span>${w.name}${w.use ? ": " + w.use : ""}</span></div>`,
        )
        .join("")}</div>`,
  ).join("");
  const type = Object.entries(TYPE)
    .map(
      ([k, v]) =>
        `<tr><td>${v.use}<br><code>${k}</code></td><td><code>DM Sans ${v.weight} ${v.size}px</code></td><td style="font:${v.weight} ${v.size}px var(--sans)">${SAMPLE[k as keyof typeof TYPE]}</td></tr>`,
    )
    .join("");
  const kinds = Object.entries(KINDS)
    .map(
      ([k, v]) =>
        `<tr><td><code>${k}</code></td><td>${v.key}</td><td>${v.meaning}</td><td><svg width="60" height="14"><path d="M2 7 H48" class="a ${k === "plain" ? "" : k}" style="stroke:var(--${k === "plain" ? "line-plain" : k === "warn" ? "d-warn" : k})" stroke-width="2.2"/></svg></td></tr>`,
    )
    .join("");
  const spacing = Object.entries(DEFAULT_TOKENS)
    .map(([k, v]) => `<code>${k}</code> ${v}`)
    .join(" · ");
  const icons = Object.entries(ICONS)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, ic]) => {
      const [, , vw, vh] = ic.viewBox.split(/\s+/).map(Number);
      const w = Math.max(40, Math.ceil((20 * vw) / vh) + 20); // room for wide marks such as the wordmark
      return `<div class="ic-cell"><svg viewBox="0 0 ${w} 40" width="${w}" height="40">${icon(name, 10, 10, 20, "ic")}</svg><code>${name}</code><span>${ic.kind}</span></div>`;
    })
    .join("");
  const sheet = `
<section class="sheet">
  <h2>Palette</h2>${swatches}
  <h2>Type scale</h2>
  <p class="note">DM Sans stands in for Aeonik, okta.com's licensed face. Sentence case everywhere; no spaced uppercase mono.</p>
  <table class="type">${type}</table>
  <h2>Line kinds</h2>
  <p class="note">Each kind keeps one meaning in every diagram (system/tokens/kinds.ts); the theme gives its colour.</p>
  <table class="type kinds">${kinds}</table>
  <h2>Layout tokens</h2>
  <p class="note">Every spacing the renderer uses, in viewBox units (system/tokens/layout.ts). Override per diagram (<code>tokens</code>) or per card (<code>box.tokens</code>).</p>
  <p class="tokens">${spacing}</p>
  <h2>Icons (${Object.keys(ICONS).length})</h2>
  <p class="note">Use a name in a card's <code>icon</code>. Lucide line icons for generic parts; Okta's Odyssey icons (<code>okta-*</code>) for Okta products; official marks for vendors. Add more with <code>bun run icons add &lt;lucide-name&gt;</code>.</p>
  <div class="icons box">${icons}</div>
</section>`;
  const css = `<style>
.sheet { max-width: 1400px; margin: 32px auto 0; display: grid; gap: 10px; }
.sheet h2 { font: 600 22px var(--sans); margin: 18px 0 4px; }
.sheet h3 { font: 600 14px var(--sans); margin: 8px 0 2px; color: var(--muted); }
.sheet .note { color: var(--muted); margin: 0; max-width: 90ch; }
.sw { display: flex; flex-wrap: wrap; gap: 10px; }
.sw .s { width: 170px; display: grid; gap: 3px; font-size: 12.5px; }
.sw .chip { height: 54px; border-radius: 16px; box-shadow: 0 4px 0 #b6c9ff; border: 1px solid rgba(0,0,0,.06); }
.sw span { color: var(--muted); line-height: 1.3; }
table.type { border-collapse: collapse; width: 100%; }
table.type td { padding: 8px 12px 8px 0; border-bottom: 1px solid var(--rule); vertical-align: middle; }
table.type td:first-child { color: var(--muted); font-size: 13px; width: 200px; }
table.type td:nth-child(2) { width: 170px; font-size: 12px; }
.icons { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; padding: 16px; border-radius: 24px;
  background: linear-gradient(55.51deg, #1a31a9 -16%, #3f59e4 64%, #6f86f0 124%); }
.ic-cell { background: #fffefa; border-radius: 12px; padding: 8px; display: grid; justify-items: start; gap: 2px; font-size: 11.5px; color: #191919; }
.ic-cell .ic { color: #3f59e4; } .ic-cell .oi { color: #3f59e4; } .ic-cell .wm { color: #191919; }
.ic-cell span { color: #6b665f; font-size: 11px; }
.kinds svg { display: block; }
.tokens { font-size: 12.5px; line-height: 1.9; max-width: 120ch; color: var(--fg); }
</style>`;
  return html.replace("</main>", `${sheet}\n</main>`).replace("</head>", `${css}\n</head>`);
}

mkdirSync(join(ROOT, "out", "specimen"), { recursive: true });
for (const t of THEMES) {
  const file = join(ROOT, "out", "specimen", `${t}.html`);
  writeFileSync(file, page(t));
  console.log(file);
}
