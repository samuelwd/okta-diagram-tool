// Prints where everything sits, in canvas units, and the free space left: so a session can
// place a card, label or key by numbers ("the free area at the bottom left is x 120-480,
// y 790-1000") instead of guessing from a scaled-down PNG.
//
//   okta-diagrams geometry <spec.json|spec.ts|slide.svg> [--json] [--min 120]
//     --json      the same as JSON
//     --min <n>   the smallest free rectangle reported, in units on each side (default 120)
import { join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { extname } from "node:path";
import { openDiagram, relockIfNeeded } from "./browser";
import { parseArgs, renderFile } from "./render";
import { loadSlide } from "./slide";
import { renderSlideHtml } from "../system";

const { pos, opt } = parseArgs(process.argv.slice(2));
if (pos.length !== 1) {
  console.error("usage: okta-diagrams geometry <spec.json|spec.ts|slide.svg> [--json] [--min 120]");
  process.exit(2);
}
relockIfNeeded(import.meta.path, pos, opt);

type R = { x: number; y: number; w: number; h: number };
type Item = R & { kind: string; name: string };
type Measured = { canvas: R; items: Item[]; lines: { name: string; pts: [number, number][] }[] };

// Runs in the page: every card, text, key, icon and line, in SVG user units.
function measure(): Measured {
  const svg = document.querySelector("svg.wiring") as SVGSVGElement;
  const vb = svg.viewBox.baseVal;
  const r = (b: DOMRect | SVGRect) => ({
    x: Math.round(b.x),
    y: Math.round(b.y),
    w: Math.round(b.width),
    h: Math.round(b.height),
  });
  const items: Item[] = [];
  for (const g of svg.querySelectorAll<SVGGElement>(".box, .frame")) {
    const rect = g.querySelector(":scope > rect") as SVGRectElement | null;
    items.push({ kind: "card", name: g.dataset.id ?? "?", ...r((rect ?? g).getBBox()) });
  }
  for (const g of svg.querySelectorAll<SVGGElement>(".legend"))
    items.push({ kind: "key", name: "key", ...r(g.getBBox()) });
  for (const g of svg.querySelectorAll<SVGGElement>(".zone")) {
    const rect = g.querySelector(":scope > rect") as SVGRectElement | null;
    if (rect)
      items.push({ kind: "zone", name: (g.textContent ?? "").trim().slice(0, 40), ...r(rect.getBBox()) });
  }
  for (const t of svg.querySelectorAll<SVGTextElement>("text")) {
    if (t.closest(".box, .frame, .legend, .step") || !(t.textContent ?? "").trim()) continue;
    items.push({ kind: "text", name: (t.textContent ?? "").trim().slice(0, 50), ...r(t.getBBox()) });
  }
  for (const c of svg.querySelectorAll<SVGGElement>(".step")) {
    if (c.closest(".legend")) continue;
    items.push({ kind: "step", name: (c.textContent ?? "").trim(), ...r(c.getBBox()) });
  }
  // hand-drawn graphics outside cards (raw SVG): icons and shapes
  for (const e of svg.querySelectorAll<SVGGraphicsElement>(
    ":scope > svg, :scope > g:not(.box):not(.frame):not(.legend):not(.zone):not(.step):not(.brandmark) > svg",
  )) {
    const s = e as unknown as SVGSVGElement;
    items.push({
      kind: "graphic",
      name: s.getAttribute("class") ?? "svg",
      x: s.x.baseVal.value,
      y: s.y.baseVal.value,
      w: s.width.baseVal.value,
      h: s.height.baseVal.value,
    });
  }
  const lines: Measured["lines"] = [];
  for (const p of svg.querySelectorAll<SVGPathElement>("path.a, path.line")) {
    if (p.closest(".legend")) continue;
    const len = p.getTotalLength();
    const pts: [number, number][] = [];
    for (let d = 0; d <= len; d += 6) {
      const q = p.getPointAtLength(d);
      pts.push([Math.round(q.x), Math.round(q.y)]);
    }
    lines.push({ name: p.getAttribute("class") ?? "a", pts });
  }
  return { canvas: { x: vb.x, y: vb.y, w: vb.width, h: vb.height }, items, lines };
}

// The largest empty rectangles on a grid, found one at a time (each taken out before the next).
function freeSpace(m: Measured, minSide: number): (R & { where: string })[] {
  const cell = 10,
    margin = 24;
  const { x: cx, y: cy, w: cw, h: ch } = m.canvas;
  const cols = Math.floor((cw - 2 * margin) / cell),
    rows = Math.floor((ch - 2 * margin) / cell);
  const ox = cx + margin,
    oy = cy + margin;
  const used = Array.from({ length: rows }, () => new Uint8Array(cols));
  const mark = (b: R, pad: number) => {
    const c0 = Math.max(0, Math.floor((b.x - pad - ox) / cell)),
      c1 = Math.min(cols - 1, Math.ceil((b.x + b.w + pad - ox) / cell));
    const r0 = Math.max(0, Math.floor((b.y - pad - oy) / cell)),
      r1 = Math.min(rows - 1, Math.ceil((b.y + b.h + pad - oy) / cell));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) used[r][c] = 1;
  };
  // the header (wordmark and title) is not free space
  mark({ x: cx, y: cy, w: cw, h: 70 }, 0);
  for (const it of m.items) if (it.kind !== "zone") mark(it, 16);
  for (const l of m.lines) for (const [x, y] of l.pts) mark({ x, y, w: 0, h: 0 }, 14);
  const out: (R & { where: string })[] = [];
  for (let n = 0; n < 12; n++) {
    // maximal rectangle by histogram, row by row
    const hgt: number[] = Array.from({ length: cols }, () => 0);
    let best = { area: 0, r: 0, c: 0, w: 0, h: 0 };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) hgt[c] = used[r][c] ? 0 : hgt[c] + 1;
      const st: number[] = [];
      for (let c = 0; c <= cols; c++) {
        const hc = c === cols ? 0 : hgt[c];
        while (st.length && hgt[st[st.length - 1]] >= hc) {
          const h = hgt[st.pop()!];
          const left = st.length ? st[st.length - 1] + 1 : 0;
          const w = c - left;
          if (h * cell >= minSide && w * cell >= minSide && w * h > best.area)
            best = { area: w * h, r: r - h + 1, c: left, w, h };
        }
        st.push(c);
      }
    }
    if (!best.area) break;
    const rect = { x: ox + best.c * cell, y: oy + best.r * cell, w: best.w * cell, h: best.h * cell };
    const mx = rect.x + rect.w / 2,
      my = rect.y + rect.h / 2;
    const where = `${my < cy + ch / 3 ? "top" : my > cy + (2 * ch) / 3 ? "bottom" : "middle"} ${mx < cx + cw / 3 ? "left" : mx > cx + (2 * cw) / 3 ? "right" : "centre"}`;
    out.push({ ...rect, where });
    for (let r = best.r; r < best.r + best.h; r++)
      for (let c = best.c; c < best.c + best.w; c++) used[r][c] = 1;
  }
  return out;
}

const input = pos[0];
const dir = join(import.meta.dir, "..", ".cache", "check");
mkdirSync(dir, { recursive: true });
let file: string;
if (extname(input) === ".svg") {
  const slide = loadSlide(input);
  file = join(dir, "geometry-slide.html");
  writeFileSync(file, renderSlideHtml(slide.svg, slide.theme ?? "blue", slide.title));
} else file = (await renderFile(input, undefined, undefined, dir)).file;

const { chromium } = await import("playwright-core");
const browser = await chromium.launch();
try {
  const { page } = await openDiagram(browser, file, { scale: 1, flat: true });
  const m = await page.evaluate(measure);
  const free = freeSpace(m, Number(opt.min ?? 120));
  if (opt.json) console.log(JSON.stringify({ canvas: m.canvas, items: m.items, free }, null, 1));
  else {
    const row = (b: R) => `x ${b.x}–${b.x + b.w}, y ${b.y}–${b.y + b.h} (${b.w} × ${b.h})`;
    console.log(`canvas: ${row(m.canvas)}`);
    for (const kind of ["card", "zone", "key", "text", "step", "graphic"]) {
      const list = m.items.filter((i) => i.kind === kind);
      if (!list.length) continue;
      console.log(`\n${kind}s:`);
      for (const i of list.sort((a, b) => a.y - b.y || a.x - b.x))
        console.log(`  ${i.name.padEnd(40).slice(0, 40)}  ${row(i)}`);
    }
    console.log(`\nfree space (no card, text, key or line within 14-16 units), largest first:`);
    for (const f of free) console.log(`  ${f.where.padEnd(14)}  ${row(f)}`);
  }
} finally {
  await browser.close();
}
