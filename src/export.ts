// Writes a diagram's PNG without a browser (resvg, src/raster.ts). The browser runs only
// for the layout check and a PDF:
//
//   bun src/export.ts <spec.json|spec.ts|slide.svg>... [options]
//   (a slide.svg is a hand-written slide styled by the theme: src/slide.ts)
//     --theme blue|gradient|all   theme for a spec (default: the spec's, else blue)
//     --scale 2                   pixel density (2 = retina; 3 for print)
//     --slide                     a 1920 x 1080 slide on the page colour (x --scale; 2 = 4K)
//     --flows                     also one image per highlight flow (for slide builds)
//     --flow <name>               only that flow lit
//     --flat                      square corners, no shadow, no margin
//     --bg                        keep the page background (default: transparent)
//     --out <dir>                 output folder (default: next to the spec)
//     --check                     also run the layout check in the browser first
//     --check-only                the layout check in the browser, write nothing
//     --pdf                       a vector PDF (browser)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { audit, pageTexts, openDiagram, printIssues, type Look } from "./browser";
import { specTexts, writingIssues } from "../system/rules/writing";
import { outDir, loadSpec, outName, parseArgs, renderFile, THEMES } from "./render";
import { rasterPng } from "./raster";
import { loadSlide } from "./slide";
import { renderSlideHtml } from "../system";
import type { Theme } from "./spec";

const { pos, opt } = parseArgs(process.argv.slice(2));
if (!pos.length) {
  console.error(
    "usage: okta-diagrams png <spec.json|spec.ts|slide.svg>... [--theme blue|gradient|all] [--scale 2] [--slide] [--flows] [--flow name] [--flat] [--bg] [--out dir] [--check] [--pdf]",
  );
  process.exit(2);
}

const outDirFor = (input: string) => outDir(input, opt.out);
// Pages the browser checks are scratch files, not output.
const CHECK_DIR = join(import.meta.dir, "..", ".cache", "check");
const look: Look = {
  scale: Number(opt.scale ?? (opt.slide ? 1 : 2)),
  flat: !!opt.flat,
  bg: !!opt.bg,
  slide: !!opt.slide,
};
const themes: (Theme | undefined)[] = opt.theme === "all" ? [...THEMES] : [opt.theme as Theme | undefined];
const suffix = opt.slide ? `-slide${look.scale! > 1 ? "-4k" : ""}` : "";
const isSlide = (f: string) => extname(f) === ".svg";
const unsupported = pos.filter((f) => ![".json", ".ts", ".svg"].includes(extname(f)));
if (unsupported.length) {
  console.error(
    `okta-diagrams png: takes a spec (.json, .ts) or a slide (.svg), not ${unsupported.join(", ")}`,
  );
  process.exit(2);
}
// A canvas outside 1.6:1 to 1.9:1 leaves bands on a 16:9 slide (docs/STYLE.md, Layout).
const canvasIssues = (spec: { canvas: { w: number; h: number } }) => {
  const r = spec.canvas.w / spec.canvas.h;
  return r < 1.6 || r > 1.9
    ? [
        {
          level: "warn" as const,
          what: `canvas is ${r.toFixed(2)}:1; between 1.6:1 and 1.9:1 fits a 16:9 slide`,
        },
      ]
    : [];
};
// A logo pasted into a raw layer: the spec grows past what a session can read, each diagram
// carries its own copy, the check cannot see it, and its source goes unrecorded. Logos belong
// in the icon set (okta-diagrams icons add-brand file:<logo.svg> --as <name> --from <page>).
const RAW_MAX = 20_000,
  SPEC_MAX = 500_000;
const kb = (n: number) => `${Math.round(n / 1000)} KB`;
const sizeIssues = (spec: { raw?: { svg: string }[] }, file: string) => {
  const out: { level: "warn"; what: string }[] = [];
  const size = readFileSync(file).length;
  if (size > SPEC_MAX)
    out.push({
      level: "warn",
      what: `the spec is ${kb(size)}; keep it under ${kb(SPEC_MAX)} so a session can read it: move pasted logos into the icon set`,
    });
  (spec.raw ?? []).forEach((r, i) => {
    const img = (r.svg.match(/href="data:image\//g) ?? []).length;
    if (r.svg.length > RAW_MAX || img)
      out.push({
        level: "warn",
        what: `raw layer ${i} is ${kb(r.svg.length)}${img ? ` with ${img} embedded image${img > 1 ? "s" : ""}` : ""}: add the logo to the icon set (okta-diagrams icons add-brand file:<logo.svg> --as <name> --from <page>) and name it on a card`,
      });
  });
  return out;
};
let failed = false;

// PNGs of specs, no browser.
if (!opt["check-only"]) {
  for (const input of pos.filter((f) => isSlide(f))) {
    const slide = loadSlide(input);
    const writing = writingIssues(slide.texts);
    for (const t of themes) {
      const theme = t ?? slide.theme ?? "blue";
      const name = outName(input, theme, slide.theme ?? "blue");
      if (!opt.check && printIssues(name, writing)) failed = true;
      const outDir = outDirFor(input);
      mkdirSync(outDir, { recursive: true });
      const path = join(outDir, `${name}${suffix}.png`);
      writeFileSync(path, rasterPng({ svg: slide.svg }, theme, look));
      console.log(`  wrote ${path}`);
    }
  }
  for (const input of pos.filter((f) => !isSlide(f))) {
    const spec = await loadSpec(input);
    const writing = [...canvasIssues(spec), ...sizeIssues(spec, input), ...writingIssues(specTexts(spec))];
    for (const t of themes) {
      const theme = t ?? spec.theme ?? "blue";
      const name = outName(input, theme, spec.theme ?? "blue");
      // with the browser check, its report (which includes the writing rules) is the one to read
      if (!opt.check && printIssues(`${name}`, writing)) failed = true;
      const outDir = outDirFor(input);
      mkdirSync(outDir, { recursive: true });
      const shot = (flow: string | null, flowSuffix: string) => {
        const path = join(outDir, `${name}${flowSuffix}${suffix}.png`);
        writeFileSync(path, rasterPng(spec, theme, look, flow));
        console.log(`  wrote ${path}`);
      };
      const all = [...new Set((spec.boxes ?? []).flatMap((b) => (b.hl ? [b.hl] : [])))];
      if (typeof opt.flow === "string") {
        if (!all.includes(opt.flow))
          throw new Error(`no flow "${opt.flow}"; flows: ${all.join(", ") || "none"}`);
        shot(opt.flow, `-${opt.flow}`);
      } else {
        shot(null, "");
        if (opt.flows) for (const f of all) shot(f, `-${f}`);
      }
    }
  }
}

// The browser: the layout check and the PDF.
if (!(opt["check-only"] || opt.check || opt.pdf)) process.exit(failed ? 1 : 0);
const { chromium } = await import("playwright-core");
const browser = await chromium.launch();
try {
  for (const input of pos) {
    for (const t of themes) {
      let file: string, label: string;
      if (isSlide(input)) {
        const slide = loadSlide(input);
        const theme = t ?? slide.theme ?? "blue";
        mkdirSync(CHECK_DIR, { recursive: true });
        file = join(CHECK_DIR, `${outName(input, theme)}.html`);
        writeFileSync(file, renderSlideHtml(slide.svg, theme, slide.title));
        label = `${outName(input, theme)} (${theme})`;
      } else {
        const r = await renderFile(input, t, undefined, CHECK_DIR);
        file = r.file;
        label = `${basename(r.file, ".html")} (${r.theme})`;
      }
      const name = basename(file, ".html");
      const { page, fontsOk } = await openDiagram(browser, file, look);
      const issues = [...(await page.evaluate(audit)), ...writingIssues(await page.evaluate(pageTexts))];
      if (!isSlide(input)) {
        const sp = await loadSpec(input);
        issues.push(...canvasIssues(sp), ...sizeIssues(sp, input));
      }
      if (!fontsOk)
        issues.unshift({
          level: "warn",
          what: "DM Sans did not load (offline?): measurements use a fallback font",
        });
      if (printIssues(label, issues)) failed = true;
      if (opt.pdf && !opt["check-only"]) {
        const outDir = outDirFor(input);
        mkdirSync(outDir, { recursive: true });
        const size = await page.evaluate(() => ({
          w: document.documentElement.scrollWidth,
          h: document.documentElement.scrollHeight,
        }));
        const path = join(outDir, `${name}${suffix}.pdf`);
        await page.emulateMedia({ media: "screen" });
        await page.pdf({
          path,
          width: `${size.w}px`,
          height: `${look.slide ? 1080 : size.h}px`,
          printBackground: true,
          pageRanges: "1",
        });
        console.log(`  wrote ${path}`);
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
