// Role chips (PEP, PDP · PEP) and pattern tags (AP1).
import { TYPE } from "../tokens/type";
import { current, type Tokens } from "../tokens/layout";
import { esc, n, textWidth } from "./text";

// ---------- chips ----------

export const chipW = (label: string, t: Tokens = current.T) =>
  Math.max(
    t.chipMinW,
    Math.round(textWidth(label, TYPE.chip.size, TYPE.chip.weight) + label.length * 0.4 + t.chipPad),
  );

export function role(label: string, x: number, y: number, t: Tokens = current.T): string {
  const w = chipW(label, t);
  return `<g class="role"><rect x="${n(x)}" y="${n(y)}" width="${w}" height="18" rx="9"/><text x="${n(x + w / 2)}" y="${n(y + 13)}" text-anchor="middle">${esc(label)}</text></g>`;
}

export function tag(label: string, right: number, y: number, t: Tokens = current.T): string {
  const w = Math.max(t.tagMinW, Math.round(textWidth(label, TYPE.tag.size, TYPE.tag.weight) + 16));
  const i = t.iconInset;
  return `<g class="ra"><rect x="${n(right - i - w)}" y="${n(y + i)}" width="${w}" height="22" rx="6"/><text x="${n(right - i - w / 2)}" y="${n(y + i + 15.5)}" text-anchor="middle">${esc(label)}</text></g>`;
}
