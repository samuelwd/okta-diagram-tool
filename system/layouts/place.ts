// Placement helpers for specs written in TypeScript (diagrams/<name>.ts with a default
// export). Cards are placed relative to each other, so adding a card or changing a
// text re-flows the rest. Heights come from the renderer (measure), so a card below
// another starts where that card really ends.
//
//   import { below, column, defineSpec, rightOf, row, zoneAround } from "../src/layout";
//   const user = { id: "user", x: 48, y: 110, w: 312, title: "Users and agents" };
//   const okta = { id: "okta", ...below(user, 56), logo: "okta-wordmark" };
//   export default defineSpec({ ..., boxes: [user, okta] });
import { measure } from "../components/card";
import type { Box, Spec, Zone } from "../schema";

export const GRID = 8;
export const GAP = 40; // between cards with a labelled line between them
export const TIGHT = 24; // between cards with nothing between them

// Snap to the 8-unit grid.
export const snap = (v: number) => Math.round(v / GRID) * GRID;

// Types a spec without changing it.
export function defineSpec(s: Spec): Spec {
  return s;
}

const bottom = (b: Box) => b.y + measure(b);

// A position under a card: same x and width, `gap` below its real bottom.
export function below(ref: Box, gap = GAP): { x: number; y: number; w: number } {
  return { x: ref.x, y: snap(bottom(ref) + gap), w: ref.w };
}

// A position right of a card: same y, `gap` to the right; give the width.
export function rightOf(ref: Box, w: number, gap = GAP): { x: number; y: number; w: number } {
  return { x: ref.x + ref.w + gap, y: ref.y, w };
}

// Stack cards top to bottom from (x, y), all `w` wide. Returns the placed cards.
export function column(
  x: number,
  y: number,
  w: number,
  cards: Omit<Box, "x" | "y" | "w">[],
  gap = GAP,
): Box[] {
  // Cards start at the given y and keep the exact gap, so the spacing is even.
  const out: Box[] = [];
  let top = y;
  for (const c of cards) {
    const b = { ...c, x, y: top, w } as Box;
    out.push(b);
    top = bottom(b) + gap;
  }
  return out;
}

// Lay cards left to right from (x, y); a card sets `w` to differ from the default `w`.
// With `equal: true` every card takes the height of the tallest.
export function row(
  x: number,
  y: number,
  w: number,
  cards: (Omit<Box, "x" | "y" | "w"> & { w?: number })[],
  gap = GAP,
  equal = true,
): Box[] {
  let left = x;
  const out = cards.map((c) => {
    const b = { ...c, x: left, y, w: c.w ?? w } as Box;
    left += b.w + gap;
    return b;
  });
  if (equal) {
    const h = Math.max(...out.map(measure));
    for (const b of out) b.h ??= h;
  }
  return out;
}

// A zone around cards, with padding and room for its label (top or bottom).
export function zoneAround(cards: Box[], label: string, at: Zone["at"] = "tl", pad = 24): Zone {
  const x0 = Math.min(...cards.map((b) => b.x)) - pad;
  const y0 = Math.min(...cards.map((b) => b.y - (b.role ? 9 : 0))) - pad - (at?.startsWith("t") ? 28 : 0);
  const x1 = Math.max(...cards.map((b) => b.x + b.w)) + pad;
  const y1 = Math.max(...cards.map(bottom)) + pad + (at?.startsWith("b") ? 28 : 0);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, label, at };
}

// The real bottom edge of a card (y + its laid-out height).
export { bottom };
