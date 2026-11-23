// Builds the browser bundle for any HTML page:
//   dist/okta-diagram.js   the <okta-diagram> element (styles, themes and icons included)
//   dist/okta-diagrams.js  the library as an ES module (renderSvg, parseSpec, tokens, ...)
//   dist/<theme>.css       one stylesheet per theme, for hand-written SVG
//   dist/spec.schema.json  the spec's JSON Schema
import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { stylesheet, fontUrls, THEMES } from "../system";

const ROOT = join(import.meta.dir, "..");
const DIST = join(ROOT, "dist");
mkdirSync(DIST, { recursive: true });
for (const [entry, name] of [
  ["system/web/okta-diagram.ts", "okta-diagram"],
  ["system/index.ts", "okta-diagrams"],
] as const) {
  const r = await Bun.build({
    entrypoints: [join(ROOT, entry)],
    target: "browser",
    format: "esm",
    minify: true,
    naming: `${name}.js`,
    outdir: DIST,
  });
  if (!r.success) {
    console.error(r.logs);
    process.exit(1);
  }
}
for (const t of THEMES) {
  const imports = fontUrls(t)
    .map((u) => `@import url("${u}");`)
    .join("\n");
  writeFileSync(join(DIST, `${t}.css`), `${imports}\n${stylesheet(t)}\n`);
}
await import("./schema");
copyFileSync(join(ROOT, "spec.schema.json"), join(DIST, "spec.schema.json"));
for (const f of [
  "okta-diagram.js",
  "okta-diagrams.js",
  ...THEMES.map((t) => `${t}.css`),
  "spec.schema.json",
]) {
  console.log(`dist/${f}  ${(Bun.file(join(DIST, f)).size / 1024).toFixed(0)} KB`);
}
