// Highlight flows: wraps an element so hovering a card lights its flow.
import type { Flow } from "../schema";
import { esc } from "./text";

// ---------- flows ----------

export const flowAttr = (f?: Flow) => (f === undefined ? "" : Array.isArray(f) ? f.join(" ") : f);
export function inFlow(svg: string, f?: Flow, hl?: string): string {
  if (f === undefined && !hl) return svg;
  const flow = flowAttr(f) || hl || "";
  const h = hl ? ` hov" data-hl="${esc(hl)}" tabindex="0` : "";
  return `<g class="fl${h}" data-flow="${esc(flow)}">${svg}</g>`;
}
