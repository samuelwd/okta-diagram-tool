// What export.ts and test.ts share: the optional browser lock, opening a rendered
// diagram in Chromium, the layout audit, and an image comparison.
import { resolve } from "node:path";
import type { Browser, Page } from "playwright-core";

import type { Issue } from "../system/rules/geometry";
export type { Issue };
export { audit } from "../system/rules/geometry";

// On a machine where browser runs must take turns, OKTA_DIAGRAMS_LOCK_CMD names a command
// that takes a lock and runs the rest of its arguments (for example
// "flock /tmp/browser.lock"). Re-run the calling script under it, with paths made absolute.
// Returns when it is unset, the lock is already held, or --no-lock is given; otherwise exits
// with the child's code.
export function relockIfNeeded(script: string, pos: string[], opt: Record<string, string | true>) {
  const lock = process.env.OKTA_DIAGRAMS_LOCK_CMD?.trim();
  if (!lock || opt["no-lock"] || process.env.OKTA_DIAGRAMS_LOCKED) return;
  const args = process.argv.slice(2).map((a) => (pos.includes(a) ? resolve(a) : a));
  if (typeof opt.out === "string") args[args.indexOf(opt.out)] = resolve(opt.out);
  const p = Bun.spawnSync([...lock.split(/\s+/), "env", "OKTA_DIAGRAMS_LOCKED=1", "bun", script, ...args], {
    stdio: ["inherit", "inherit", "inherit"],
  });
  process.exit(p.exitCode ?? 1);
}

export type Look = {
  scale?: number; // device pixels per unit (default 2)
  flat?: boolean; // square corners, no shadow, no margin
  bg?: boolean; // page background instead of transparent
  slide?: boolean; // a 1920 x 1080 slide (x scale), the canvas fitted and centred
};

// Open a rendered page in export mode. Returns the page and whether DM Sans loaded.
export async function openDiagram(
  browser: Browser,
  file: string,
  look: Look,
): Promise<{ page: Page; fontsOk: boolean; size: { w: number; h: number } }> {
  const scale = look.scale ?? 2;
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
  await page.goto("file://" + resolve(file));
  const vb = await page.evaluate(() => {
    const b = (document.querySelector("svg.wiring") as SVGSVGElement).viewBox.baseVal;
    return { w: b.width, h: b.height };
  });
  let width = vb.w;
  if (look.slide) {
    const m = 56; // slide margin
    width = Math.floor(Math.min(1920 - 2 * m, ((1080 - 2 * m - 14) * vb.w) / vb.h));
  }
  await page.evaluate(
    ({ width, flat, bg, slide }) => {
      const body = document.body;
      body.classList.add("export");
      if (flat) body.classList.add("flat");
      if (slide) body.classList.add("slide");
      if (bg || slide) body.style.background = "var(--bg)";
      if (!slide) body.style.padding = flat ? "0" : "24px 24px 48px";
      document.documentElement.style.setProperty("--export-w", width + "px");
      document.documentElement.style.background = "transparent";
    },
    { width, flat: !!look.flat, bg: !!look.bg, slide: !!look.slide },
  );
  // A short viewport lets a full-page screenshot end where the canvas ends.
  if (!look.slide)
    await page.setViewportSize({ width: Math.ceil(width + (look.flat ? 0 : 48)), height: 200 });
  await page.evaluate(() => document.fonts.ready);
  const fontsOk = await page.evaluate(() => document.fonts.check('600 16px "DM Sans"'));
  return { page, fontsOk, size: vb };
}

// Compare two PNGs in the browser (no image library needed). Counts pixels whose colour
// differs by more than `tolerance` in any channel; returns that share and a diff image.
// Anti-aliased text edges move by up to about 100 between runs; a real recolour moves more.
export async function compare(
  page: Page,
  a: Buffer,
  b: Buffer,
  tolerance = 110,
): Promise<{ sizeMatch: boolean; ratio: number; diff?: Buffer }> {
  const r = await page.evaluate(
    async ({ a, b, tolerance }) => {
      const load = (src: string) =>
        new Promise<HTMLImageElement>((ok, bad) => {
          const i = new Image();
          i.onload = () => ok(i);
          i.onerror = bad;
          i.src = src;
        });
      const [ia, ib] = await Promise.all([
        load("data:image/png;base64," + a),
        load("data:image/png;base64," + b),
      ]);
      if (ia.width !== ib.width || ia.height !== ib.height) return { sizeMatch: false, ratio: 1, diff: null };
      const pixels = (img: HTMLImageElement) => {
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const x = c.getContext("2d")!;
        x.drawImage(img, 0, 0);
        return x.getImageData(0, 0, c.width, c.height);
      };
      const pa = pixels(ia),
        pb = pixels(ib);
      const out = document.createElement("canvas");
      out.width = ia.width;
      out.height = ia.height;
      const ox = out.getContext("2d")!;
      const od = ox.createImageData(ia.width, ia.height);
      let bad = 0;
      for (let i = 0; i < pa.data.length; i += 4) {
        const d = Math.max(
          Math.abs(pa.data[i] - pb.data[i]),
          Math.abs(pa.data[i + 1] - pb.data[i + 1]),
          Math.abs(pa.data[i + 2] - pb.data[i + 2]),
          Math.abs(pa.data[i + 3] - pb.data[i + 3]),
        );
        if (d > tolerance) {
          bad++;
          od.data.set([255, 0, 80, 255], i);
        } else od.data.set([pa.data[i], pa.data[i + 1], pa.data[i + 2], 40], i);
      }
      ox.putImageData(od, 0, 0);
      return {
        sizeMatch: true,
        ratio: bad / (pa.data.length / 4),
        diff: bad ? out.toDataURL("image/png").split(",")[1] : null,
      };
    },
    { a: a.toString("base64"), b: b.toString("base64"), tolerance },
  );
  return { sizeMatch: r.sizeMatch, ratio: r.ratio, diff: r.diff ? Buffer.from(r.diff, "base64") : undefined };
}

// Every text drawn in the diagram, for the writing rules.
export function pageTexts(): string[] {
  return [...document.querySelectorAll("svg.wiring text")]
    .map((t) => (t.textContent ?? "").trim())
    .filter(Boolean);
}

export function printIssues(name: string, issues: Issue[]): number {
  const errors = issues.filter((i) => i.level === "error").length;
  console.log(`\n${name}: ${errors} errors, ${issues.length - errors} warnings`);
  for (const i of issues) console.log(`  ${i.level === "error" ? "ERROR" : "warn "} ${i.what}`);
  return errors;
}
