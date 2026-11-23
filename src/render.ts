// Command line: render a diagram spec to a standalone HTML page.
//
//   bun src/render.ts <spec.json|spec.ts>... [--theme blue|gradient|all] [--out dir]
//
// Output: <spec name>-<theme>.html next to the spec, or in --out. The rendering itself is the library in
// system/ (import from "okta-diagram-tool"); this file loads and validates specs and writes files.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { ICONS, parseSpec, renderHtml, THEMES, type Spec, type Theme } from "../system";
import { useExactMeasurement } from "./fonts";

// The command-line tools measure text exactly (DM Sans, as the export browser draws it).
useExactMeasurement();

const ROOT = join(import.meta.dir, "..");

// Icons kept out of the shared set (`okta-diagrams icons keep-local`) live in
// system/icons/local-icons.json, which git ignores; they load on top of the shared set.
const LOCAL_ICONS = join(ROOT, "system", "icons", "local-icons.json");
if (existsSync(LOCAL_ICONS)) Object.assign(ICONS, JSON.parse(readFileSync(LOCAL_ICONS, "utf8")).icons ?? {});
export { THEMES };
// re-exported for the scripts
export { renderHtml, icon, ICONS, measure, textWidth } from "../system";

// A TypeScript spec imports "okta-diagram-tool" (older specs: "okta-diagrams"). Inside this checkout the package resolves itself;
// elsewhere, load a copy (next to the spec, so its relative imports work, and removed at
// once) with that import pointed at this library.
async function importSpec(abs: string): Promise<unknown> {
  if (abs.startsWith(ROOT + "/")) return (await import(abs)).default;
  const lib = join(ROOT, "system", "index.ts");
  const src = readFileSync(abs, "utf8").replace(
    /(from\s+|import\s*\(\s*)(["'])okta-diagrams?(?:-tool)?\2/g,
    `$1$2${lib}$2`,
  );
  const tmp = join(dirname(abs), `.${basename(abs, ".ts")}.okta-diagram-tool-${process.pid}.ts`);
  writeFileSync(tmp, src);
  try {
    return (await import(tmp)).default;
  } finally {
    rmSync(tmp, { force: true });
  }
}

// Load a spec file (JSON, or TypeScript with a default export) and validate it.
export async function loadSpec(file: string): Promise<Spec> {
  const abs = resolve(file);
  const raw = extname(abs) === ".json" ? JSON.parse(readFileSync(abs, "utf8")) : await importSpec(abs);
  return parseSpec(raw, basename(abs));
}

// Where output goes by default: next to the spec. The regression examples write to out/.
export function defaultOutDir(specFile: string): string {
  const abs = resolve(specFile);
  return abs.startsWith(join(ROOT, "examples") + "/") ? join(ROOT, "out") : dirname(abs);
}

// The output folder for a spec: --out if given, else the default.
export function outDir(specFile: string, out: string | true | undefined): string {
  return resolve(typeof out === "string" ? out : defaultOutDir(specFile));
}

// Output name: the spec's name. Only a theme other than the spec's own (its "theme", else
// blue) adds a suffix, so flow.json writes flow.png and, with --theme gradient, flow-gradient.png.
export function outName(specFile: string, theme: Theme, specTheme: Theme = "blue"): string {
  const base = basename(specFile, extname(specFile));
  return theme === specTheme ? base : `${base}-${theme}`;
}

// Render a spec to an HTML page: <dir>/<name>.html (<name>-<theme>.html for another theme), or exactly outFile.
export async function renderFile(
  specFile: string,
  themeArg?: Theme,
  outFile?: string,
  dir?: string,
): Promise<{ file: string; spec: Spec; theme: Theme }> {
  const spec = await loadSpec(specFile);
  const theme = themeArg ?? spec.theme ?? "blue";
  if (!THEMES.includes(theme)) throw new Error(`unknown theme "${theme}"; themes: ${THEMES.join(", ")}`);
  const file = resolve(
    outFile ?? join(dir ?? defaultOutDir(specFile), `${outName(specFile, theme, spec.theme ?? "blue")}.html`),
  );
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, renderHtml(spec, theme));
  return { file, spec, theme };
}

export function parseArgs(argv: string[]): { pos: string[]; opt: Record<string, string | true> } {
  const pos: string[] = [];
  const opt: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      pos.push(a);
      continue;
    }
    const [k, v] = a.slice(2).split("=", 2);
    if (v !== undefined) opt[k] = v;
    else if (argv[i + 1] && !argv[i + 1].startsWith("--") && ["theme", "out", "scale", "flow"].includes(k))
      opt[k] = argv[++i];
    else opt[k] = true;
  }
  return { pos, opt };
}

if (import.meta.main) {
  const { pos, opt } = parseArgs(process.argv.slice(2));
  if (!pos.length) {
    console.error("usage: bun src/render.ts <spec.json|spec.ts>... [--theme blue|gradient|all] [--out dir]");
    process.exit(2);
  }
  for (const f of pos) {
    const themes = opt.theme === "all" ? [...THEMES] : [opt.theme as Theme | undefined];
    for (const t of themes) {
      const r = await renderFile(f, t, undefined, outDir(f, opt.out));
      console.log(r.file);
    }
  }
}
