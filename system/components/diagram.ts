// The diagram: zones, panels, cards, lines, text, steps, raw SVG, key and heading, in order.
import type { Kind, Spec } from "../schema";
import { DEFAULT_TOKENS, current } from "../tokens/layout";
import { layBox, type Laid } from "./card";
import { inFlow } from "./flow";
import { icon } from "./icon";
import { layLegend } from "./key";
import { layArrow, stepSvg } from "./line";
import { laySidebar } from "./panel";
import { esc, n } from "./text";

// ---------- the page ----------

export function markers(): string {
  const kinds: [Kind, string][] = [
    ["req", "ah-req"],
    ["cfg", "ah-cfg"],
    ["attr", "ah-attr"],
    ["log", "ah-log"],
    ["warn", "ah-warn"],
    ["plain", "ah"],
    ["inv" as Kind, "ah-inv"],
  ];
  return `<defs>${kinds
    .map(
      ([k, c]) =>
        `<marker id="ah-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path class="${c}" d="M0 0 L10 5 L0 10 z"/></marker>`,
    )
    .join("")}</defs>`;
}

export function renderSvg(spec: Spec): string {
  current.T = { ...DEFAULT_TOKENS, ...spec.tokens };
  const vx = spec.canvas.x ?? 0,
    vy = spec.canvas.y ?? 0;
  const out: string[] = [markers()];
  for (const z of spec.zones ?? []) {
    const at = z.at ?? "tl";
    const above = at === "above";
    const tx = above
      ? z.x + (z.labelX ?? 0)
      : at.endsWith("l")
        ? z.x + (z.labelX ?? current.T.zoneLabelX)
        : z.x + z.w - (z.labelX ?? current.T.zoneLabelRight);
    const ty = above
      ? z.y - current.T.stageLabelGap
      : at.startsWith("t")
        ? z.y + current.T.zoneLabelY
        : z.y + z.h - current.T.zoneLabelBottom;
    const anchorAt = at.endsWith("r") ? ` text-anchor="end"` : "";
    const cls = ["zone", z.style && z.style !== "outline" && z.style, above && "above"]
      .filter(Boolean)
      .join(" ");
    out.push(
      inFlow(
        `<g class="${cls}"><rect x="${n(z.x)}" y="${n(z.y)}" width="${n(z.w)}" height="${n(z.h)}" rx="12"/><text x="${n(tx)}" y="${n(ty)}"${anchorAt}>${esc(z.label)}</text></g>`,
        z.flow,
      ),
    );
  }
  for (const p of spec.panels ?? [])
    out.push(
      inFlow(
        `<rect class="sidepanel" x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${n(p.h)}" rx="12"/>`,
        p.flow,
      ),
    );
  const raw = (layer: "under" | "over") =>
    (spec.raw ?? [])
      .filter((r) => (r.layer ?? "over") === layer)
      .forEach((r) => out.push(inFlow(r.svg, r.flow)));
  raw("under");
  let sideBottom: number | null = null;
  if (spec.sidebar) {
    const sb = laySidebar(spec);
    out.push(sb.svg);
    sideBottom = sb.bottom;
  }
  const laid = new Map<string, Laid>();
  for (const b of spec.boxes ?? []) {
    if (laid.has(b.id)) throw new Error(`two cards have the id "${b.id}"`);
    const l = layBox(b);
    laid.set(b.id, l);
    out.push(l.svg);
  }
  for (const a of spec.arrows ?? []) out.push(layArrow(a, laid));
  for (const t of spec.texts ?? []) {
    const lines = Array.isArray(t.text) ? t.text : [t.text];
    const a = t.anchor ? ` text-anchor="${t.anchor}"` : "";
    out.push(
      inFlow(
        lines
          .map(
            (l, i) =>
              `<text class="${t.cls ?? "ftext"}" x="${n(t.x)}" y="${n(t.y + i * 17)}"${a}>${esc(l)}</text>`,
          )
          .join(""),
        t.flow,
      ),
    );
  }
  for (const m of spec.marks ?? []) out.push(inFlow(stepSvg(m.n, m.at[0], m.at[1], m.kind ?? "req"), m.flow));
  raw("over");
  out.push(layLegend(spec, sideBottom));
  const heading = spec.heading === false ? null : (spec.heading ?? spec.title);
  const brand = spec.brand ?? true;
  if (brand)
    out.push(
      `<g class="brandmark">${icon("okta-wordmark", vx + 40, vy + 18, 26, "bm")}<path d="M${vx + 134} ${vy + 16} V${vy + 46}" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="1.5"/></g>`,
    );
  if (heading)
    out.push(
      `<text class="dtitle" x="${n(vx + (brand ? current.T.headingX : 40))}" y="${n(vy + current.T.headingY)}">${esc(heading)}</text>`,
    );
  const vb = `${vx} ${vy} ${spec.canvas.w} ${spec.canvas.h}`;
  return `<svg class="wiring" viewBox="${vb}" role="img" aria-label="${esc(spec.description)}">\n${out.join("\n")}\n</svg>`;
}
