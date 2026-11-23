// Icons: draws a named icon from system/icons/icons.json.
import iconSet from "../icons/icons.json";
import { n } from "./text";

type Icon = { viewBox: string; kind: "stroke" | "fill" | "color"; body: string };
export const ICONS = iconSet as Record<string, Icon>;

// ---------- icons ----------

// `size` is the height; with `fit` (the default, except the Okta wordmark and the header) a
// mark wider than tall is fitted into a size x size square, so a wordmark in an icon slot
// shrinks instead of running over the text beside it. The Okta aura mark is drawn in the
// wordmark colour (black on cream cards), never the icon blue.
export function icon(name: string, x: number, y: number, size: number, cls = "ic", fit = true): string {
  const ic = ICONS[name];
  if (!ic)
    throw new Error(`unknown icon "${name}"; run \`bun scripts/icons.ts list\` or \`add <lucide-name>\``);
  const [, , vw, vh] = ic.viewBox.split(/\s+/).map(Number);
  let w = size * (vw / vh),
    h = size;
  if (fit && vw > vh && name !== "okta-wordmark" && cls !== "bm") {
    w = size;
    h = (size * vh) / vw;
    y += (size - h) / 2;
  }
  if (ic.kind === "stroke")
    return `<svg class="${cls}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" viewBox="${ic.viewBox}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ic.body}</svg>`;
  const aura = name === "okta-aura" ? " aura" : "";
  const c =
    ic.kind === "fill"
      ? ` class="${name === "okta-wordmark" && cls !== "bm" ? "wm" : cls === "ic" ? "oi" : cls}${aura}"`
      : "";
  return `<svg${c} x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" viewBox="${ic.viewBox}" aria-hidden="true">${ic.body}</svg>`;
}
