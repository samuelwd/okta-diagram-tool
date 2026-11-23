// PNG without a browser: the rendered SVG, with the theme's variables resolved and the
// canvas (background, corners, shadow) drawn in SVG, rasterised by resvg with DM Sans.
// The browser stays the checker (check, test); this is only the drawing.
import { Resvg } from "@resvg/resvg-js";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { renderSvg, stylesheet, type Spec } from "../system";
import type { Theme } from "./spec";
import type { Look } from "./browser";

const FONTS = join(import.meta.dir, "..", "system", "fonts");
const fontFiles = readdirSync(FONTS)
  .filter((f) => f.endsWith(".ttf"))
  .map((f) => join(FONTS, f));

// Split at top-level commas (not inside parentheses).
function splitTop(s: string, sep = ","): string[] {
  const out: string[] = [];
  let depth = 0,
    cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === sep && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

// The custom properties set on :root (later ones win), and the stylesheet without those blocks.
function resolveVars(css: string): { vars: Map<string, string>; rest: string } {
  const vars = new Map<string, string>();
  const rest = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@import[^;]+;/g, "")
    .replace(/([^{}]*:root[^{}]*)\{([^}]*)\}/g, (_, _sel, body: string) => {
      for (const d of splitTop(body, ";")) {
        const m = d.match(/^(--[\w-]+)\s*:\s*([\s\S]+)$/);
        if (m) vars.set(m[1], m[2].trim());
      }
      return "";
    });
  return { vars, rest };
}

// Replace var(--x) and var(--x, fallback), nested, until none are left.
function subst(value: string, vars: Map<string, string>, depth = 0): string {
  if (depth > 10) return value;
  let out = "",
    i = 0;
  while (i < value.length) {
    const at = value.indexOf("var(", i);
    if (at < 0) {
      out += value.slice(i);
      break;
    }
    out += value.slice(i, at);
    let j = at + 4,
      d = 1;
    while (j < value.length && d) {
      if (value[j] === "(") d++;
      if (value[j] === ")") d--;
      j++;
    }
    const [name, ...fb] = splitTop(value.slice(at + 4, j - 1));
    const v = vars.get(name.trim()) ?? fb.join(",");
    out += subst(v, vars, depth + 1);
    i = j;
  }
  return out;
}

// resvg ignores the font shorthand: "font: italic 600 13px/1.5 "DM Sans", sans-serif" becomes
// font-style, font-weight, font-size and font-family.
function expandFont(body: string): string {
  return body.replace(/(^|;)\s*font\s*:\s*([^;]+)/g, (_, lead: string, v: string) => {
    const m = v.trim().match(/^(italic\s+)?(\d{3}\s+)?([\d.]+px)(?:\/[\d.]+)?\s+(.+)$/);
    if (!m) return `${lead} font: ${v}`;
    return `${lead} ${m[1] ? "font-style: italic; " : ""}${m[2] ? `font-weight: ${m[2].trim()}; ` : ""}font-size: ${m[3]}; font-family: ${m[4].trim()}`;
  });
}

// A CSS colour as SVG colour and opacity (rgba is split, since stop-color takes no alpha).
function colour(c: string): { color: string; opacity: number } {
  const m = c.match(/^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/);
  return m ? { color: `rgb(${m[1]},${m[2]},${m[3]})`, opacity: Number(m[4]) } : { color: c, opacity: 1 };
}

function stops(parts: string[]): string {
  return parts
    .map((p) => {
      const m = p.match(/^(.*?)\s+(-?[\d.]+)%$/);
      const { color, opacity } = colour((m ? m[1] : p).trim());
      return `<stop offset="${m ? Number(m[2]) / 100 : 0}" stop-color="${color}" stop-opacity="${opacity}"/>`;
    })
    .join("");
}

// CSS background layers (radial-gradient, linear-gradient, a colour) as SVG, bottom layer first.
function background(css: string, w: number, h: number, clip: string): { defs: string; body: string } {
  let defs = "",
    body = "";
  splitTop(css)
    .reverse()
    .forEach((layer, i) => {
      const id = `cbg${i}`;
      const fn = layer.match(/^(radial|linear)-gradient\(([\s\S]*)\)$/);
      if (!fn) {
        const { color, opacity } = colour(layer);
        body += `<rect width="${w}" height="${h}" fill="${color}" fill-opacity="${opacity}"${clip}/>`;
        return;
      }
      const [head, ...rest] = splitTop(fn[2]);
      if (fn[1] === "radial") {
        const g = head.match(/ellipse\s+([\d.]+)%\s+([\d.]+)%\s+at\s+(-?[\d.]+)%\s+(-?[\d.]+)%/);
        if (!g) throw new Error(`canvas background: cannot read "${head}"`);
        const [rx, ry, cx, cy] = g.slice(1).map(Number);
        defs += `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${(cx * w) / 100} ${(cy * h) / 100}) scale(${(rx * w) / 100} ${(ry * h) / 100})">${stops(rest)}</radialGradient>`;
      } else {
        const a = (Number(head.replace("deg", "")) * Math.PI) / 180;
        const len = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a));
        const dx = (Math.sin(a) * len) / 2,
          dy = (-Math.cos(a) * len) / 2;
        // CSS stops may run past 0% and 100%; map them onto the line, then clamp.
        const pts = rest.map((p) => {
          const m = p.match(/(-?[\d.]+)%$/);
          return m ? Number(m[1]) : 0;
        });
        const lo = Math.min(0, ...pts),
          hi = Math.max(100, ...pts),
          span = hi - lo;
        const at = (t: number) => [w / 2 - dx + (2 * dx * t) / 100, h / 2 - dy + (2 * dy * t) / 100];
        const [x1, y1] = at(lo),
          [x2, y2] = at(hi);
        const scaled = rest.map((p, k) => p.replace(/(-?[\d.]+)%$/, `${((pts[k] - lo) / span) * 100}%`));
        defs += `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(scaled)}</linearGradient>`;
      }
      body += `<rect width="${w}" height="${h}" fill="url(#${id})"${clip}/>`;
    });
  return { defs, body };
}

// CSS box-shadow list as SVG rounded rects under the canvas, bottom shadow first.
function shadows(css: string, w: number, h: number, r: number): { defs: string; body: string } {
  if (!css || css === "none") return { defs: "", body: "" };
  let defs = "",
    body = "";
  splitTop(css)
    .reverse()
    .forEach((s, i) => {
      const m = s.match(
        /^(-?[\d.]+)(?:px)?\s+(-?[\d.]+)(?:px)?\s+(-?[\d.]+)(?:px)?(?:\s+(-?[\d.]+)(?:px)?)?\s+(.+)$/,
      );
      if (!m) throw new Error(`canvas shadow: cannot read "${s}"`);
      const [ox, oy, blur, spread] = [m[1], m[2], m[3], m[4] ?? "0"].map(Number);
      const { color, opacity } = colour(m[5]);
      let filter = "";
      if (blur) {
        defs += `<filter id="sh${i}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${blur / 2}"/></filter>`;
        filter = ` filter="url(#sh${i})"`;
      }
      body += `<rect x="${ox - spread}" y="${oy - spread}" width="${w + 2 * spread}" height="${h + 2 * spread}" rx="${Math.max(0, r + spread)}" fill="${color}" fill-opacity="${opacity}"${filter}/>`;
    });
  return { defs, body };
}

// The diagram as one standalone SVG document, laid out as the browser export lays it out.
export function rasterSvg(
  spec: Spec | { svg: string },
  theme: Theme,
  look: Look,
  flow?: string | null,
): { svg: string; width: number; height: number } {
  const { vars, rest } = resolveVars(stylesheet(theme));
  // Only rules resvg can use: no pseudo-classes, no HTML-only selectors.
  const rules = [...rest.matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .filter(
      ([, sel]) =>
        !/[:@]/.test(sel) &&
        !/\b(body|main|header|h1|figcaption|\.scroll|\.eyebrow|\.lede|\.hint)\b/.test(sel) &&
        !/^\s*\*\s*$/.test(sel),
    )
    .map(([, sel, body]) => {
      // rx as a CSS property is SVG 2; resvg reads it as an attribute only, so rules carry it in a class map.
      return `${sel.trim()} { ${expandFont(subst(body, vars)).replace(/\s+/g, " ").trim()} }`;
    });
  // Corner radii set in CSS (rx: 16px), applied as attributes below.
  const rxRules = rules.flatMap((r) => {
    const m = r.match(/^(.+?) \{.*?\brx: ([\d.]+)px/);
    return m ? [[m[1], m[2]] as const] : [];
  });

  // a hand-written slide's theme variables can sit anywhere (attributes, inline style): resolve them all
  // (inside an attribute, a value's double quotes become single quotes)
  let inner =
    "svg" in spec
      ? subst(
          spec.svg.replace(
            /="([^"]*var\([^"]*)"/g,
            (_, v: string) => `="${subst(v, vars).replace(/"/g, "'")}"`,
          ),
          vars,
        )
      : renderSvg(spec);
  const vb = inner
    .match(/viewBox="([^"]+)"/)![1]
    .split(" ")
    .map(Number);
  const [vx, vy, W, H] = vb;
  inner = applyRx(inner, rxRules);
  // resvg draws orient="auto-start-reverse" at 0 degrees: use "auto", with a mirrored copy
  // of each arrowhead for line starts.
  inner = inner
    .replace(
      /<marker id="([^"]+)"([^>]*?)refX="9"([^>]*?)orient="auto-start-reverse"><path class="([^"]+)" d="[^"]*"\/><\/marker>/g,
      (_, id, a, b, cls) =>
        `<marker id="${id}"${a}refX="9"${b}orient="auto"><path class="${cls}" d="M0 0 L10 5 L0 10 z"/></marker>` +
        `<marker id="${id}-start"${a}refX="1"${b}orient="auto"><path class="${cls}" d="M10 0 L0 5 L10 10 z"/></marker>`,
    )
    .replace(/marker-start="url\(#([^)]+)\)"/g, 'marker-start="url(#$1-start)"');
  if (flow) inner = applyFlow(inner, flow, Number(subst("var(--dim)", vars)) || 0.2);

  const r = look.flat ? 0 : parseFloat(subst("var(--canvas-radius)", vars)) || 0;
  const pageBg = subst("var(--bg)", vars);
  let width: number, height: number, cw: number, ox: number, oy: number;
  if (look.slide) {
    const m = 56;
    cw = Math.floor(Math.min(1920 - 2 * m, ((1080 - 2 * m - 14) * W) / H));
    width = 1920;
    height = 1080;
    ox = (1920 - cw) / 2;
    oy = (1080 - (cw * H) / W) / 2;
  } else {
    cw = W;
    ox = look.flat ? 0 : 24;
    oy = look.flat ? 0 : 24;
    width = W + 2 * ox;
    height = H + (look.flat ? 0 : 72);
  }
  const k = cw / W,
    ch = H * k;
  const clip = r ? ` clip-path="url(#canvas-clip)"` : "";
  const bg = background(subst("var(--canvas-bg)", vars), cw, ch, clip);
  const sh = look.flat ? { defs: "", body: "" } : shadows(subst("var(--canvas-shadow)", vars), cw, ch, r);
  const ink = subst("var(--ink)", vars);
  const body = inner.replace(
    /^<svg class="wiring" viewBox="[^"]+"[^>]*>/,
    `<svg class="wiring" x="0" y="0" width="${cw}" height="${ch}" viewBox="${vx} ${vy} ${W} ${H}" color="${ink}">`,
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<style>${rules.join("\n")}</style>
<defs><clipPath id="canvas-clip"><rect width="${cw}" height="${ch}" rx="${r}"/></clipPath>${bg.defs}${sh.defs}</defs>
${look.bg || look.slide ? `<rect width="${width}" height="${height}" fill="${pageBg}"/>` : ""}
<g transform="translate(${ox} ${oy})">${sh.body}${bg.body}${body}</g>
</svg>`;
  return { svg, width, height };
}

// CSS corner radii, as rx attributes on the rects those rules select (the selectors are simple).
function applyRx(svg: string, rxRules: (readonly [string, string])[]): string {
  const byClass: [RegExp, string][] = [];
  for (const [sel, rx] of rxRules) {
    for (const one of sel.split(",").map((s) => s.trim())) {
      // ".zone rect", ".box > rect", ".role rect", ".ra rect": the group's class, then its rect.
      const m = one.match(/^\.([\w-]+)(?:\s*>\s*|\s+)rect$/);
      if (m)
        byClass.push([
          new RegExp(
            `(<g class="(?:[^"]* )?${m[1]}(?: [^"]*)?"[^>]*>(?:<g[^>]*>)?<rect\\b[^>]*?) rx="[^"]*"`,
            "g",
          ),
          rx,
        ]);
    }
  }
  for (const [re, rx] of byClass) svg = svg.replace(re, `$1 rx="${rx}"`);
  return svg;
}

// One flow lit: every top-level element outside it at the theme's dim opacity, as the page's
// hover does (svg.wiring.hl > *:not(.on)). The key, wordmark and heading stay lit.
function applyFlow(svg: string, flow: string, dim: number): string {
  let depth = -1; // the outer <svg> is depth 0 once opened
  return svg.replace(
    /<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g,
    (all, closing: string, tag: string, attrs: string, self: string) => {
      if (closing) {
        depth--;
        return all;
      }
      const top = depth === 0;
      if (!self) depth++;
      if (!top || tag === "defs" || /class="(legend|brandmark|dtitle)\b/.test(attrs)) return all;
      const f = attrs.match(/data-flow="([^"]*)"/)?.[1].split(" ") ?? [];
      return f.includes(flow) || f.includes("all") ? all : `<${tag}${attrs} opacity="${dim}"${self}>`;
    },
  );
}

export function rasterPng(
  spec: Spec | { svg: string },
  theme: Theme,
  look: Look,
  flow?: string | null,
): Buffer {
  const { svg } = rasterSvg(spec, theme, look, flow);
  const scale = look.scale ?? 2;
  const r = new Resvg(svg, {
    fitTo: { mode: "zoom", value: scale },
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: "DM Sans" },
    shapeRendering: 2,
    textRendering: 2,
  });
  return r.render().asPng();
}
