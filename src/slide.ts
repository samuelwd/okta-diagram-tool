// A hand-written slide: an SVG file drawn freely, styled by the theme.
//
// The file is plain SVG with a viewBox. Colours and fonts come from the theme's variables, so
// one file renders in every theme: fill="var(--ink)", fill="var(--pill-accent)",
// font-family="var(--heading-family)". Two additions the tool expands:
//   <icon name="users" x="40" y="40" size="48"/>              an icon from the set (colour: currentColor)
//   <icon name="okta-wordmark" view="0 0 33 33" .../>          the same, cropped to a viewBox
// Wrap a shape and its text as <g class="box" data-id="name"><rect .../>…</g> and the layout
// check keeps the text inside the shape. The theme is --theme, else data-theme on the root
// <svg>, else blue. The tool draws the theme's canvas (background, corners, edge) behind it.
import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { ICONS, icon, markers, type Theme } from "../system";

export type Slide = { svg: string; theme?: Theme; title: string; texts: string[] };

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

export function loadSlide(file: string): Slide {
  const src = readFileSync(file, "utf8");
  const open = src.match(/<svg\b[^>]*>/);
  if (!open) throw new Error(`${basename(file)}: no <svg> element`);
  const viewBox = attr(open[0], "viewBox");
  if (!viewBox) throw new Error(`${basename(file)}: the root <svg> needs a viewBox`);
  const theme = attr(open[0], "data-theme") as Theme | undefined;
  const title = src.match(/<title>([^<]*)<\/title>/)?.[1] ?? basename(file, extname(file));

  let body = src.slice(src.indexOf(open[0]) + open[0].length, src.lastIndexOf("</svg>"));
  body = body.replace(/<icon\b([^>]*?)\/>/g, (_, a: string) => {
    const name = attr(a, "name")!;
    const ic = ICONS[name];
    if (!ic) throw new Error(`${basename(file)}: unknown icon "${name}" (okta-diagrams icons find ${name})`);
    const x = Number(attr(a, "x") ?? 0),
      y = Number(attr(a, "y") ?? 0),
      size = Number(attr(a, "size") ?? 24);
    const cls = attr(a, "class") ?? "ic";
    const view = attr(a, "view");
    if (!view) return icon(name, x, y, size, cls);
    // cropped: the same body in a narrower viewBox
    const [, , vw, vh] = view.split(/\s+/).map(Number);
    const stroke =
      ic.kind === "stroke"
        ? ` fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`
        : "";
    return `<svg class="${cls}" x="${x}" y="${y}" width="${(size * vw) / vh}" height="${size}" viewBox="${view}"${stroke}>${ic.body}</svg>`;
  });
  const texts = [...body.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)]
    .map((m) =>
      m[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
  const svg = `<svg class="wiring" viewBox="${viewBox}" role="img" aria-label="${title.replace(/"/g, "&quot;")}">\n${markers()}\n${body}\n</svg>`;
  return { svg, theme, title, texts };
}
