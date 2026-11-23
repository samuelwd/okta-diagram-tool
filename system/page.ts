// A standalone HTML page for one diagram: fonts, styles, the SVG, and the hover script.
import { attachHighlight } from "./components/highlight";
import { renderSvg } from "./components/diagram";
import { esc } from "./components/text";
import type { Spec, Theme } from "./schema";
import { fontUrls, stylesheet } from "./styles";

const SCRIPT = `(${attachHighlight.toString()})(document.querySelector("svg.wiring"), window);`;

export function renderHtml(spec: Spec, theme: Theme): string {
  const links = fontUrls(theme)
    .map((u) => `<link rel="stylesheet" href="${u}">`)
    .join("\n");
  const p = spec.page ?? {};
  const header =
    p.eyebrow || p.heading || p.lede
      ? `<header>${p.eyebrow ? `<p class="eyebrow">${esc(p.eyebrow)}</p>` : ""}${p.heading ? `<h1>${esc(p.heading)}</h1>` : ""}${p.lede ? `<p class="lede">${esc(p.lede)}</p>` : ""}</header>`
      : "";
  const hasHl = (spec.boxes ?? []).some((b) => b.hl);
  const hint = p.hint ?? (hasHl ? "Hover or focus a card to light its flow." : "");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(spec.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
${links}
<style>
${stylesheet(theme)}
</style>
</head>
<body data-theme-name="${theme}">
<main class="diagram">
${header}
<div class="scroll">
${renderSvg(spec)}
</div>
${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ""}
${hint ? `<p class="hint">${esc(hint)}</p>` : ""}
</main>
<script>
${SCRIPT}
</script>
</body>
</html>
`;
}

// A page for a hand-written slide: its SVG (already given class "wiring") with the theme's
// styles and fonts, so the browser check sees it exactly as a diagram.
export function renderSlideHtml(svg: string, theme: Theme, title: string): string {
  const links = fontUrls(theme)
    .map((u) => `<link rel="stylesheet" href="${u}">`)
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
${links}
<style>
${stylesheet(theme)}
</style>
</head>
<body data-theme-name="${theme}">
<main class="diagram">
<div class="scroll">
${svg}
</div>
</main>
</body>
</html>
`;
}
