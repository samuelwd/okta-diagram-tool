// Regression test: renders every example in every theme, runs the layout audit, and
// compares each image with its stored snapshot in tests/snapshots/.
//
//   bun run test              audit and compare; diff images go to out/test/
//   bun run test --update     write the snapshots (after a change you meant to make)
//   bun run test --no-lock    skip the browser lock (OKTA_DIAGRAMS_LOCK_CMD)
//
// A theme or renderer change that moves more than 0.01% of a diagram's pixels fails here.
// Snapshots are the PNG the export writes (resvg), flat (no shadow, no margin) at 1x; the
// layout check runs on the HTML page in the browser.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { audit, pageTexts, compare, openDiagram, printIssues, relockIfNeeded } from "./browser";
import { writingIssues } from "../system/rules/writing";
import { loadSpec, parseArgs, renderFile, THEMES } from "./render";
import { rasterPng } from "./raster";

const ROOT = join(import.meta.dir, "..");
const SNAP = join(ROOT, "tests", "snapshots");
const OUT = join(ROOT, "out", "test");
const LIMIT = 0.0001; // 0.01% of pixels; reruns measure 0.000%, and a recoloured line type moves 0.05% or more

const { pos, opt } = parseArgs(process.argv.slice(2));
relockIfNeeded(import.meta.path, pos, opt);

function specs(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return specs(p);
    return /\.(json|ts)$/.test(f) && !f.endsWith(".d.ts") ? [p] : [];
  });
}

const { chromium } = await import("playwright-core");
mkdirSync(SNAP, { recursive: true });
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const look = { scale: 1, flat: true };
let failures = 0,
  written = 0,
  passed = 0;
try {
  for (const spec of specs(join(ROOT, "examples")).sort()) {
    const key = relative(join(ROOT, "examples"), spec)
      .replace(/\.(json|ts)$/, "")
      .replace(/[\\/]/g, "--");
    for (const theme of THEMES) {
      const name = `${key}-${theme}`;
      const t = theme as (typeof THEMES)[number];
      const file = (await renderFile(spec, t, join(OUT, `${name}.html`))).file;
      const { page, fontsOk } = await openDiagram(browser, file, look);
      if (!fontsOk) {
        console.log(`\n${name}: DM Sans did not load; cannot compare offline`);
        failures++;
        await page.close();
        continue;
      }
      const errors = printIssues(name, [
        ...(await page.evaluate(audit)),
        ...writingIssues(await page.evaluate(pageTexts)),
      ]);
      if (errors) failures++;
      const png = rasterPng(await loadSpec(spec), t, look);
      const snap = join(SNAP, `${name}.png`);
      if (opt.update || !existsSync(snap)) {
        writeFileSync(snap, png);
        written++;
        console.log(`  snapshot written: ${relative(ROOT, snap)}`);
      } else {
        const r = await compare(page, png, readFileSync(snap));
        if (!r.sizeMatch) {
          failures++;
          writeFileSync(join(OUT, `${name}.png`), png);
          console.log(`  FAIL size changed (new image: out/test/${name}.png)`);
        } else if (r.ratio > LIMIT) {
          failures++;
          writeFileSync(join(OUT, `${name}.png`), png);
          if (r.diff) writeFileSync(join(OUT, `${name}.diff.png`), r.diff);
          console.log(`  FAIL ${(r.ratio * 100).toFixed(2)}% of pixels changed (out/test/${name}.diff.png)`);
        } else {
          passed++;
          console.log(`  ok (${(r.ratio * 100).toFixed(3)}% changed)`);
        }
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
}
console.log(`\n${passed} matched, ${written} written, ${failures} failed`);
process.exit(failures ? 1 : 0);
