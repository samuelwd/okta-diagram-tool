// Line: anchors on card edges, elbow routing or smooth curves, arrowheads, labels and steps.
import type { Arrow, Kind, Point } from "../schema";
import { current } from "../tokens/layout";
import type { Laid } from "./card";
import { inFlow } from "./flow";
import { esc, n } from "./text";

// ---------- arrows ----------

export type P = { x: number; y: number; side?: string };

export function anchor(p: Point, laid: Map<string, Laid>, gap: number): P {
  if (Array.isArray(p)) return { x: p[0], y: p[1] };
  const m = p.match(/^([\w-]+)\.(top|bottom|left|right)(?:@(-?[\d.]+)(%)?)?$/);
  if (!m) throw new Error(`bad point "${p}": use [x, y] or "card.side" or "card.side@offset"`);
  const l = laid.get(m[1]);
  if (!l) throw new Error(`point "${p}": no card with id "${m[1]}"`);
  const { x, y, w } = l.box;
  const h = l.h;
  const side = m[2];
  const len = side === "top" || side === "bottom" ? w : h;
  const off = m[3] === undefined ? len / 2 : m[4] ? (Number(m[3]) / 100) * len : Number(m[3]);
  switch (side) {
    case "top":
      return { x: x + off, y: y - gap, side };
    case "bottom":
      return { x: x + off, y: y + h + gap, side };
    case "left":
      return { x: x - gap, y: y + off, side };
    default:
      return { x: x + w + gap, y: y + off, side };
  }
}

const vertical = (s?: string) => s === "top" || s === "bottom";
const horizontal = (s?: string) => s === "left" || s === "right";

export function route(a: Arrow, laid: Map<string, Laid>): P[] {
  const pts = anchors(a, laid);
  const out: P[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const from = out[out.length - 1];
    const to = pts[i];
    if (from.x !== to.x && from.y !== to.y) {
      let hFirst = (a.elbow ?? "hv") === "hv";
      if (i === 1 && vertical(from.side)) hFirst = false;
      else if (i === 1 && horizontal(from.side)) hFirst = true;
      else if (vertical(to.side)) hFirst = true;
      else if (horizontal(to.side)) hFirst = false;
      out.push(hFirst ? { x: to.x, y: from.y } : { x: from.x, y: to.y });
    }
    out.push(to);
  }
  return out;
}

// ---------- curves ----------

// A curved line is a chain of cubic Béziers, one per pair of points; each piece keeps its
// control points so the path, the arrowhead tangent and the sampled polyline agree.
export type Bezier = { a: P; c1: P; c2: P; b: P };

// The way out of a card side (top: up, left: leftwards ...).
const OUT: Record<string, [number, number]> = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };

const unit = (x: number, y: number): [number, number] => {
  const l = Math.hypot(x, y);
  return l ? [x / l, y / l] : [0, 0];
};

export function anchors(a: Arrow, laid: Map<string, Laid>): P[] {
  const head = a.head ?? "end";
  return a.points.map((p, i) => {
    const last = i === a.points.length - 1;
    const gap = (last && head !== "none") || (i === 0 && head === "both") ? current.T.arrowGap : 0;
    return anchor(p, laid, gap);
  });
}

// Smooth curve through every point. An end on a card side leaves (or arrives) square to that
// side; a raw [x, y] end heads for its neighbour; a waypoint's tangent runs from the point
// before it to the point after it. Each handle reaches `reach` times its piece's length.
export function curve(a: Arrow, laid: Map<string, Laid>): Bezier[] {
  const ps = anchors(a, laid);
  const reach = typeof a.curve === "number" ? a.curve : current.T.curveReach;
  const last = ps.length - 1;
  const tan = ps.map((p, i): [number, number] => {
    if (i === 0) return p.side ? OUT[p.side] : unit(ps[1].x - p.x, ps[1].y - p.y);
    if (i === last) {
      if (!p.side) return unit(p.x - ps[i - 1].x, p.y - ps[i - 1].y);
      const [ox, oy] = OUT[p.side];
      return [-ox, -oy]; // arriving: into the side
    }
    return unit(ps[i + 1].x - ps[i - 1].x, ps[i + 1].y - ps[i - 1].y);
  });
  return ps.slice(1).map((b, i) => {
    const p = ps[i];
    const h = Math.hypot(b.x - p.x, b.y - p.y) * reach;
    return {
      a: p,
      c1: { x: p.x + tan[i][0] * h, y: p.y + tan[i][1] * h },
      c2: { x: b.x - tan[i + 1][0] * h, y: b.y - tan[i + 1][1] * h },
      b,
    };
  });
}

export function curveD(bs: Bezier[]): string {
  let d = `M${n(bs[0].a.x)} ${n(bs[0].a.y)}`;
  for (const { c1, c2, b } of bs) d += ` C${n(c1.x)} ${n(c1.y)} ${n(c2.x)} ${n(c2.y)} ${n(b.x)} ${n(b.y)}`;
  return d;
}

// The curve as a polyline, fine enough for lengths, steps and label placement.
export function sample(bs: Bezier[]): P[] {
  const out: P[] = [bs[0].a];
  for (const { a, c1, c2, b } of bs) {
    const k = current.T.curveSamples;
    for (let j = 1; j <= k; j++) {
      const t = j / k,
        u = 1 - t;
      out.push({
        x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
        y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
      });
    }
  }
  return out;
}

export function pathD(ps: P[]): string {
  let d = `M${n(ps[0].x)} ${n(ps[0].y)}`;
  for (let i = 1; i < ps.length; i++) {
    const a = ps[i - 1],
      b = ps[i];
    if (a.y === b.y) d += ` H${n(b.x)}`;
    else if (a.x === b.x) d += ` V${n(b.y)}`;
    else d += ` L${n(b.x)} ${n(b.y)}`;
  }
  return d;
}

export function along(ps: P[], t: number): P {
  const segs = ps.slice(1).map((b, i) => Math.hypot(b.x - ps[i].x, b.y - ps[i].y));
  let d = segs.reduce((s, v) => s + v, 0) * t;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const f = segs[i] ? d / segs[i] : 0;
      return { x: ps[i].x + (ps[i + 1].x - ps[i].x) * f, y: ps[i].y + (ps[i + 1].y - ps[i].y) * f };
    }
    d -= segs[i];
  }
  return ps[0];
}

export function stepSvg(num: number | string, x: number, y: number, kind: Kind): string {
  const cls = kind === "attr" || kind === "cfg" ? ` ${kind}` : " req";
  return `<g class="step${cls}"><circle cx="${n(x)}" cy="${n(y)}" r="11"/><text x="${n(x)}" y="${n(y + 4.5)}" text-anchor="middle">${esc(String(num))}</text></g>`;
}

export function layArrow(a: Arrow, laid: Map<string, Laid>): string {
  // a curve is drawn from its Béziers and measured on its sampled polyline
  const bs = a.curve ? curve(a, laid) : undefined;
  const ps = bs ? sample(bs) : route(a, laid);
  const head = a.head ?? "end";
  const m = `url(#ah-${a.inverse ? "inv" : a.kind})`;
  const marks =
    (head !== "none" ? ` marker-end="${m}"` : "") + (head === "both" ? ` marker-start="${m}"` : "");
  const cls = `a${a.kind === "plain" ? "" : " " + a.kind}${a.dashed ? " opt" : ""}${a.inverse ? " inv" : ""}`;
  let svg = `<path class="${cls}" d="${bs ? curveD(bs) : pathD(ps)}"${marks}/>`;
  if (a.label) {
    const lines = Array.isArray(a.label.text) ? a.label.text : [a.label.text];
    let x: number,
      y: number,
      anchorAt = a.label.anchor;
    if (a.label.at) [x, y] = a.label.at;
    else if (bs) {
      // at the middle of the curve: above it where it runs across, right of it where it runs down
      const m = along(ps, 0.5),
        p = along(ps, 0.45),
        q = along(ps, 0.55);
      if (Math.abs(q.x - p.x) >= Math.abs(q.y - p.y)) {
        x = m.x;
        y = m.y - current.T.labelOffset - (lines.length - 1) * current.T.labelLine;
        anchorAt ??= "middle";
      } else {
        x = m.x + current.T.labelOffset;
        y = m.y - ((lines.length - 1) * current.T.labelLine) / 2 + 4;
        anchorAt ??= "start";
      }
    } else {
      // beside the longest leg: above a horizontal one, right of a vertical one
      let best = 1,
        bestLen = -1;
      for (let i = 1; i < ps.length; i++) {
        const len = Math.hypot(ps[i].x - ps[i - 1].x, ps[i].y - ps[i - 1].y);
        if (len > bestLen) {
          best = i;
          bestLen = len;
        }
      }
      const p = ps[best - 1],
        q = ps[best];
      if (p.y === q.y) {
        x = (p.x + q.x) / 2;
        y = p.y - current.T.labelOffset - (lines.length - 1) * current.T.labelLine;
        anchorAt ??= "middle";
      } else {
        x = p.x + current.T.labelOffset;
        y = (p.y + q.y) / 2 - ((lines.length - 1) * current.T.labelLine) / 2 + 4;
        anchorAt ??= "start";
      }
    }
    const kc = a.kind === "plain" ? "" : " " + a.kind;
    lines.forEach((l, i) => {
      svg += `<text class="lbl${kc}" x="${n(x)}" y="${n(y + i * current.T.labelLine)}" text-anchor="${anchorAt ?? "middle"}">${esc(l)}</text>`;
    });
  }
  for (const s of a.steps ?? []) {
    const p = Array.isArray(s.at) ? { x: s.at[0], y: s.at[1] } : along(ps, s.at ?? 0.5);
    svg += stepSvg(s.n, p.x, p.y, s.kind ?? a.kind);
  }
  return inFlow(svg, a.flow);
}
