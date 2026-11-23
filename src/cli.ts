#!/usr/bin/env bun
// okta-diagrams: one command for the diagram tool, from any folder.
//
// A spec can live in any project. Its PNG (and PDF or HTML when asked) go next to it, or to
// --out <dir>. The examples' PNGs sit next to them; other output from examples goes to out/. TypeScript specs import "okta-diagram-tool" with nothing installed.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";

const ROOT = join(import.meta.dir, "..");
const HELP = `okta-diagrams: Okta architecture and concept diagrams in an Okta-inspired style

Make a diagram (from any folder; outputs go next to the spec):
  okta-diagrams new <file.json|file.ts> [--from <example>]
  okta-diagrams png <spec>...         <name>.png (2x, transparent corners), no browser;
                                      another theme than the spec's adds -<theme>
      --check                         run the layout check (headless browser) as well
      --slide [--scale 2]             a 1920 x 1080 slide (4K with --scale 2)
      --theme blue|gradient|all       --flows  --flow <name>  --pdf  --flat  --bg  --out <dir>
  okta-diagrams check <spec>...       the layout and writing checks only
  okta-diagrams geometry <spec>       where every card, text, key and line sits, and the free space, in canvas units
  okta-diagrams render <spec>...      an HTML page for the web (hover a card to light its flow)
  A <spec> may also be a hand-written slide.svg, styled by theme variables (src/slide.ts).
  Every command writes next to the spec, or to --out <dir>.
  okta-diagrams icons find <name>     search Okta's Odyssey icons, theSVG, Simple Icons and Lucide
  okta-diagrams icons add-brand <source>:<slug> | add <lucide-name> | list

Change the tool:
  okta-diagrams verify                type-check, lint, format check, snapshot test, example PNGs, specimen
  okta-diagrams test [--update]       the snapshot test alone
  okta-diagrams build                 dist/: the <okta-diagram> element, the library, theme CSS
  okta-diagrams schema | specimen     spec.schema.json | the style reference pages

Documents in ${ROOT}: README.md (start here), docs/DESIGN-SYSTEM.md (the system and its terms),
docs/STYLE.md (the look), docs/WRITING.md (the words), AGENTS.md (changing the tool).`;

const TEMPLATES: Record<string, string> = {
  "token-flow": "examples/token-flow.json",
  "scim-provisioning": "examples/scim-provisioning.ts",
  "customer-identity": "examples/customer-identity.json",
  "workforce-identity": "examples/workforce-identity.json",
  "enterprise-identity-hub": "examples/enterprise-identity-hub.json",
};

const SCRIPTS: Record<string, string[]> = {
  png: ["src/export.ts"],
  check: ["src/export.ts", "--check-only"],
  geometry: ["src/geometry.ts"],
  render: ["src/render.ts"],
  icons: ["scripts/icons.ts"],
  test: ["src/test.ts"],
  build: ["scripts/build.ts"],
  schema: ["scripts/schema.ts"],
  specimen: ["scripts/specimen.ts"],
};

function newDiagram(args: string[]) {
  const target = args.find((a) => !a.startsWith("--"));
  const fromIdx = args.indexOf("--from");
  const from =
    fromIdx >= 0 ? args[fromIdx + 1] : extname(target ?? "") === ".ts" ? "scim-provisioning" : "token-flow";
  if (!target) throw new Error("usage: okta-diagrams new <file.json|file.ts> [--from <template>]");
  const template = TEMPLATES[from];
  if (!template)
    throw new Error(`unknown template "${from}"; templates: ${Object.keys(TEMPLATES).join(", ")}`);
  const out = resolve(target);
  if (existsSync(out)) throw new Error(`${out} exists`);
  if (extname(out) !== extname(template))
    throw new Error(
      `template "${from}" is ${extname(template)}; name the file ${basename(out, extname(out))}${extname(template)}`,
    );
  mkdirSync(dirname(out), { recursive: true });
  if (extname(out) === ".json") {
    const spec = JSON.parse(readFileSync(join(ROOT, template), "utf8"));
    const schema = join(ROOT, "spec.schema.json");
    spec.$schema = out.startsWith(ROOT + "/") ? relative(dirname(out), schema) : `file://${schema}`;
    writeFileSync(out, JSON.stringify(spec, null, 1) + "\n");
  } else copyFileSync(join(ROOT, template), out);
  console.log(`${out}\nfrom ${template}; edit it, then: okta-diagrams png ${relative(process.cwd(), out)}`);
}

const [cmd, ...args] = process.argv.slice(2);
if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
  console.log(HELP);
} else if (cmd === "new") {
  newDiagram(args);
} else if (cmd === "verify") {
  // everything a change to the tool must pass, in order, stopping at the first failure
  const examples = Array.from(new Bun.Glob("examples/*.{json,ts}").scanSync({ cwd: ROOT })).sort();
  const steps = [
    ["bunx", "tsc", "-p", "."],
    ["bunx", "oxlint", "--deny-warnings"],
    ["bunx", "oxfmt", "--check", "."],
    ["bun", "src/test.ts", ...args],
    ["bun", "src/export.ts", ...examples, "--out", "examples"], // each example's PNG, next to it
    ["bun", "scripts/specimen.ts"],
  ];
  for (const step of steps) {
    console.log(`\n$ ${step.join(" ")}`);
    const p = Bun.spawnSync(step, { stdio: ["inherit", "inherit", "inherit"], cwd: ROOT });
    if (p.exitCode) process.exit(p.exitCode);
  }
  console.log("\nverify: passed");
} else if (SCRIPTS[cmd]) {
  const [script, ...fixed] = SCRIPTS[cmd];
  const p = Bun.spawnSync(["bun", join(ROOT, script), ...fixed, ...args], {
    stdio: ["inherit", "inherit", "inherit"],
    cwd: process.cwd(),
  });
  process.exit(p.exitCode ?? 1);
} else {
  console.error(`unknown command "${cmd}"\n\n${HELP}`);
  process.exit(2);
}
