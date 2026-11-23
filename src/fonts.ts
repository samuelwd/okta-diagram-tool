// Exact text measurement for the command-line tools: DM Sans v17, the same variable font
// file the pages load from Google Fonts, measured the way the export browser (Chromium on
// Linux) draws it: each letter's advance and each kerning adjustment rounded to whole
// pixels, at optical size 14. Pages turn optical sizing off and the PNG's static DM Sans
// files are the opsz-14 instance, so browser, measurement and PNG agree at every size.
import * as fontkit from "fontkit";
import { join } from "node:path";
import { setMeasurer, type Measurer } from "../system";

const FONTS = join(import.meta.dir, "..", "system", "fonts");
type Font = {
  getVariation(v: Record<string, number>): any;
  unitsPerEm: number;
  hasGlyphForCodePoint(c: number): boolean;
};
const latin = fontkit.openSync(join(FONTS, "dm-sans-v17-latin.woff2")) as Font;
const latinExt = fontkit.openSync(join(FONTS, "dm-sans-v17-latin-ext.woff2")) as Font;

const instances = new Map<string, any>();
function instance(font: Font, which: string, weight: number, _size: number) {
  const opsz = 14; // pages set font-optical-sizing: none; the static TTFs are opsz 14
  const key = `${which}/${weight}/${opsz}`;
  let v = instances.get(key);
  if (!v) instances.set(key, (v = font.getVariation({ wght: weight, opsz })));
  return v;
}

// A run of text in one font file, rounded as Chromium on Linux rounds it.
function runWidth(font: Font, which: string, s: string, size: number, weight: number): number {
  const run = instance(font, which, weight, size).layout(s);
  const scale = size / font.unitsPerEm;
  let w = 0;
  run.glyphs.forEach((g: any, i: number) => {
    w +=
      Math.round(g.advanceWidth * scale) + Math.round((run.positions[i].xAdvance - g.advanceWidth) * scale);
  });
  return w;
}

export const fontkitMeasurer: Measurer = (s, size, weight) => {
  // Split into runs by the subset file that holds each character (latin covers our text).
  let width = 0,
    run = "",
    ext = false;
  const flush = () => {
    if (run) width += runWidth(ext ? latinExt : latin, ext ? "ext" : "latin", run, size, weight);
    run = "";
  };
  for (const ch of s) {
    const e =
      !latin.hasGlyphForCodePoint(ch.codePointAt(0)!) && latinExt.hasGlyphForCodePoint(ch.codePointAt(0)!);
    if (e !== ext) {
      flush();
      ext = e;
    }
    run += ch;
  }
  flush();
  return width;
};

export function useExactMeasurement(): void {
  setMeasurer(fontkitMeasurer);
}
