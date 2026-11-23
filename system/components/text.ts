// Text helpers: escaping, number formatting, and DM Sans width estimates for wrapping.

// ---------- text helpers ----------

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const n = (v: number) => String(Math.round(v * 10) / 10);

// Text measurement. The default is an estimate from per-letter widths (about ±6%), so the
// library works anywhere with no font file. The command-line tools install an exact
// measurer (src/fonts.ts: the DM Sans font file, measured as the export browser draws it),
// and <okta-diagram> measures in the viewer's browser.
export type Measurer = (s: string, size: number, weight: number) => number;

export function charEm(c: string): number {
  if (c === " ") return 0.26;
  if ("iljI.,:;'!|".includes(c)) return 0.25;
  if ("frt()[]-/".includes(c)) return 0.35;
  if ("mwMW".includes(c)) return 0.82;
  if (/[A-Z]/.test(c)) return 0.65;
  if (/[0-9]/.test(c)) return 0.57;
  if ("·•".includes(c)) return 0.3;
  return 0.53;
}
export const estimate: Measurer = (s, size, weight) => {
  let w = 0;
  for (const c of s) w += charEm(c);
  return w * size * 1.05 * (weight >= 600 ? 1.04 : 1);
};

let measurer: Measurer = estimate;
export function setMeasurer(m: Measurer | null): void {
  measurer = m ?? estimate;
}
export function textWidth(s: string, size: number, weight = 400): number {
  return measurer(s, size, weight);
}

export function wrap(
  text: string | string[] | undefined,
  maxW: number,
  size: number,
  weight = 400,
): string[] {
  if (text === undefined) return [];
  if (Array.isArray(text)) return text; // the author broke the lines
  const lines: string[] = [];
  let cur = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = cur ? `${cur} ${word}` : word;
    if (cur && textWidth(next, size, weight) > maxW) {
      lines.push(cur);
      cur = word;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}
