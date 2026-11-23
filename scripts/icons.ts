// The icon set: system/icons/icons.json, built from four sources, each icon's origin recorded in
// system/icons/icon-sources.json and system/icons/ICON-SOURCES.md.
//
//   okta-diagrams icons list                          every icon name, its kind and source
//   okta-diagrams icons find <query>                  search Odyssey, theSVG, Simple Icons and Lucide
//   okta-diagrams icons add <lucide-name>...          add Lucide line icons (generic parts)
//   okta-diagrams icons add-brand <source>:<slug>[:<variant>] [--as <name>] [--color]
//       odyssey:<Name>    Okta's Odyssey icon, e.g. odyssey:Lock -> okta-lock (Okta products)
//       thesvg:<slug>     an official vendor mark from theSVG, e.g. thesvg:splunk
//                         variants: default (colour, the default), mono, wordmark, ...
//       simple:<slug>     a Simple Icons mark, e.g. simple:kong; one colour,
//                         drawn in the text colour, or its brand colour with --color
//       file:<path.svg>   a mark saved from the vendor's site, when no library has it;
//                         needs --as <name> and --from <the page it came from>; --mono draws
//                         a one-colour mark in the text colour
//   okta-diagrams icons remove <name>
//   okta-diagrams icons keep-local <name>...          move icons to system/icons/local-icons.json, which
//                                                     git ignores: they still draw, but are never shared
//   okta-diagrams icons                               rebuild system/icons/icons.json
//
// Lookup order for a diagram: an Okta product -> odyssey; a vendor -> thesvg, then simple,
// then the vendor's site (file:); a generic part -> lucide. Never draw a look-alike of a vendor's mark.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// Pinned versions. Change a pin deliberately, then re-add the icons that should move with it.
const THESVG_REF = "551229c"; // glincker/thesvg commit, 2026-11-21
const SIMPLE_ICONS = "16.38.0";
const ODYSSEY = "1.73.1"; // @okta/odyssey-react-mui

type Icon = { viewBox: string; kind: "stroke" | "fill" | "color"; body: string };
type Source = { source: string; ref: string; url: string; license: string; added: string; note?: string };

const ROOT = join(import.meta.dir, "..");
const OUT = join(ROOT, "system", "icons", "icons.json");
const BRAND = join(ROOT, "system", "icons", "brand-icons.json");
const SOURCES = join(ROOT, "system", "icons", "icon-sources.json");
const SOURCES_MD = join(ROOT, "system", "icons", "ICON-SOURCES.md");
const LOCAL = join(ROOT, "system", "icons", "local-icons.json");
const CACHE = join(ROOT, ".cache", "icons");

const CURATED = `database user users workflow file-code-corner cloud key-round server app-window
scale plug scroll-text bot globe smartphone laptop monitor building-2 building lock shield
shield-check fingerprint-pattern network git-branch git-merge webhook terminal mail bell layers
box link settings activity eye file-text key key-square id-card badge-check cpu container radar
siren clock refresh-cw arrow-right-left cloud-cog landmark briefcase user-check user-x user-plus
log-in ticket gauge message-square sparkles brain handshake waypoints router hard-drive
folder-lock file-lock scan-face wifi map-pin triangle-alert circle-check circle-x list-checks
package store credit-card heart-pulse`
  .split(/\s+/)
  .filter(Boolean);
const ALIASES: Record<string, string> = {
  fingerprint: "fingerprint-pattern",
  "file-code": "file-code-corner",
};

const today = () => new Date().toISOString().slice(0, 10);
const readJson = <T>(f: string, d: T): T => (existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : d);
const writeJson = (f: string, v: unknown) => writeFileSync(f, JSON.stringify(v, null, 1) + "\n");
const sortObj = <T>(o: Record<string, T>) =>
  Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));

async function fetchText(url: string): Promise<string> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} for ${url}`);
  return r.text();
}

// Cache an index file under .cache/icons (git ignores it).
async function cached(name: string, url: string): Promise<string> {
  mkdirSync(CACHE, { recursive: true });
  const f = join(CACHE, name);
  if (existsSync(f)) return readFileSync(f, "utf8");
  const t = await fetchText(url);
  writeFileSync(f, t);
  return t;
}

// ---------- Lucide (local Bun cache) ----------

function lucideDir(): { dir: string; version: string } {
  const cache = join(homedir(), ".bun", "install", "cache");
  const dirs = readdirSync(cache)
    .filter((d) => /^lucide-react@\d/.test(d))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (!dirs.length)
    throw new Error("no lucide-react in the Bun cache; run `bun add lucide-react` once anywhere");
  const last = dirs[dirs.length - 1];
  return { dir: join(cache, last, "dist", "esm", "icons"), version: last.split("@")[1] };
}

// Lucide ships each icon as [["path", {d: ...}], ...]; turn that back into SVG markup.
function lucide(name: string): Icon {
  const file = join(lucideDir().dir, `${name}.mjs`);
  if (!existsSync(file))
    throw new Error(`no Lucide icon "${name}" (try \`okta-diagrams icons find ${name}\`)`);
  const src = readFileSync(file, "utf8");
  // An alias file only re-exports another icon: follow it.
  const alias = src.match(/export \{ default \} from '\.\/(.+)\.mjs'/);
  if (alias) return lucide(alias[1]);
  // Evaluate the whole __iconData object literal; its "node" field holds the shapes.
  const start = src.indexOf("const __iconData = ");
  const end = src.indexOf("\n};", start);
  if (start < 0 || end < 0) throw new Error(`cannot read ${file}`);
  const data = new Function(`return ${src.slice(start + 19, end)}\n}`)();
  const node: [string, Record<string, string>][] = data.node;
  const body = node
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .filter(([k]) => k !== "key")
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      return `<${tag} ${a}/>`;
    })
    .join("");
  return { viewBox: "0 0 24 24", kind: "stroke", body };
}

function lucideSource(): Source {
  const { version } = lucideDir();
  return {
    source: "lucide",
    ref: `lucide-react ${version}`,
    url: "https://lucide.dev/icons",
    license: "ISC",
    added: today(),
  };
}

// ---------- SVG helpers ----------

// Take an SVG file apart: its viewBox and inner markup, minus <title>.
function parseSvg(svg: string): { viewBox: string; body: string } {
  const m = svg.match(/<svg([^>]*)>([\s\S]*)<\/svg>/);
  if (!m) throw new Error("not an SVG");
  const vb = m[1].match(/viewBox="([^"]+)"/)?.[1];
  if (!vb) throw new Error("SVG without a viewBox");
  const body = m[2].replace(/<title>[\s\S]*?<\/title>/g, "").trim();
  // A colour set on the root <svg> (theSVG: <svg fill="#29B5E8">) belongs to the mark.
  const fill = m[1].match(/\bfill="([^"]+)"/)?.[1];
  return { viewBox: vb, body: fill && fill !== "none" ? `<g fill="${fill}">${body}</g>` : body };
}

// One-colour marks draw in the text colour.
function monochrome(body: string): string {
  return body
    .replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"')
    .replace(/<(path|circle|rect|ellipse|polygon)(?![^>]*\bfill=)/g, '<$1 fill="currentColor"');
}

// Prefix every id inside a mark with its name, so two marks on one page never share an id
// (theSVG files often use ids such as "a" for gradients and clip paths).
function namespaceIds(body: string, name: string): string {
  const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  let out = body;
  for (const id of ids) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out
      .replace(new RegExp(`\\bid="${esc}"`, "g"), `id="${name}-${id}"`)
      .replace(new RegExp(`url\\(#${esc}\\)`, "g"), `url(#${name}-${id})`)
      .replace(new RegExp(`href="#${esc}"`, "g"), `href="#${name}-${id}"`);
  }
  return out;
}

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

// ---------- sources ----------

type Hit = { id: string; title: string; detail: string };

async function odysseyNames(): Promise<string[]> {
  const t = await cached(
    `odyssey-${ODYSSEY}.json`,
    `https://data.jsdelivr.com/v1/packages/npm/@okta/odyssey-react-mui@${ODYSSEY}?structure=flat`,
  );
  return JSON.parse(t)
    .files.map((f: { name: string }) => f.name)
    .filter((n: string) => /^\/dist\/esm\/icons\.generated\/[A-Z]\w*\.js$/.test(n))
    .map((n: string) => n.replace(/^.*\/(\w+)\.js$/, "$1"));
}

async function odyssey(name: string): Promise<{ icon: Icon; src: Source }> {
  const url = `https://cdn.jsdelivr.net/npm/@okta/odyssey-react-mui@${ODYSSEY}/dist/esm/icons.generated/${name}.js`;
  const js = await fetchText(url);
  const vb = js.match(/viewBox: "([^"]+)"/)?.[1] ?? "0 0 16 16";
  // Each shape is _jsx("path", { ...attributes }) with no nested objects.
  const shapes = [...js.matchAll(/_jsx\("(path|circle|rect|ellipse|g)", \{([^{}]*)\}\)/g)].map(
    ([, tag, attrs]) => {
      const a = [...attrs.matchAll(/(\w+): "([^"]*)"/g)]
        .filter(([, k]) => k !== "xmlns")
        .map(([, k, v]) => `${kebab(k)}="${k === "fill" && v !== "none" ? "currentColor" : v}"`)
        .join(" ");
      return `<${tag} ${a}/>`;
    },
  );
  if (!shapes.length) throw new Error(`cannot read the shapes in ${url}`);
  return {
    icon: { viewBox: vb, kind: "fill", body: shapes.join("") },
    src: {
      source: "odyssey",
      ref: `@okta/odyssey-react-mui ${ODYSSEY}`,
      url,
      license: "Apache-2.0 (Okta, Inc.)",
      added: today(),
    },
  };
}

type TheSvgEntry = {
  slug: string;
  title: string;
  aliases: string[];
  variants: Record<string, string>;
  license: string;
  url?: string;
  guidelines?: string;
};
async function thesvgIndex(): Promise<TheSvgEntry[]> {
  const t = await cached(
    `thesvg-${THESVG_REF}.json`,
    `https://cdn.jsdelivr.net/gh/glincker/thesvg@${THESVG_REF}/src/data/icons.json`,
  );
  const j = JSON.parse(t);
  return Array.isArray(j) ? j : Object.values(j);
}

async function thesvg(slug: string, variant = "default"): Promise<{ icon: Icon; src: Source }> {
  const e = (await thesvgIndex()).find((x) => x.slug === slug);
  if (!e) throw new Error(`theSVG has no "${slug}" (try \`okta-diagrams icons find ${slug}\`)`);
  const path = e.variants[variant];
  if (!path)
    throw new Error(
      `theSVG "${slug}" has no variant "${variant}"; variants: ${Object.keys(e.variants).join(", ")}`,
    );
  const url = `https://cdn.jsdelivr.net/gh/glincker/thesvg@${THESVG_REF}/public${path}`;
  const { viewBox, body } = parseSvg(await fetchText(url));
  const mono = /mono|dark|light/i.test(variant);
  return {
    icon: { viewBox, kind: mono ? "fill" : "color", body: mono ? monochrome(body) : body },
    src: {
      source: "thesvg",
      ref: `glincker/thesvg@${THESVG_REF}`,
      url,
      license: `${e.license} (data); the mark is its owner's trademark`,
      added: today(),
      note: e.guidelines ? `usage: ${e.guidelines}` : undefined,
    },
  };
}

type SimpleEntry = {
  title: string;
  slug?: string;
  hex: string;
  guidelines?: string;
  license?: { type: string };
};
async function simpleIndex(): Promise<(SimpleEntry & { slug: string })[]> {
  const t = await cached(
    `simple-icons-${SIMPLE_ICONS}.json`,
    `https://cdn.jsdelivr.net/npm/simple-icons@${SIMPLE_ICONS}/data/simple-icons.json`,
  );
  const j = JSON.parse(t);
  const list: SimpleEntry[] = Array.isArray(j) ? j : j.icons;
  // Entries without a slug take one from the title, as Simple Icons does.
  const slugOf = (title: string) =>
    title
      .toLowerCase()
      .replace(/\+/g, "plus")
      .replace(/\./g, "dot")
      .replace(/&/g, "and")
      .normalize("NFD")
      .replace(/[^a-z0-9]/g, "");
  return list.map((e) => ({ ...e, slug: e.slug ?? slugOf(e.title) }));
}

async function simple(slug: string, color: boolean): Promise<{ icon: Icon; src: Source }> {
  const e = (await simpleIndex()).find((x) => x.slug === slug);
  if (!e) throw new Error(`Simple Icons has no "${slug}" (try \`okta-diagrams icons find ${slug}\`)`);
  const url = `https://cdn.jsdelivr.net/npm/simple-icons@${SIMPLE_ICONS}/icons/${slug}.svg`;
  const { viewBox, body } = parseSvg(await fetchText(url));
  return {
    icon: color
      ? { viewBox, kind: "color", body: body.replace(/<path/g, `<path fill="#${e.hex}"`) }
      : { viewBox, kind: "fill", body: monochrome(body) },
    src: {
      source: "simple-icons",
      ref: `simple-icons ${SIMPLE_ICONS}`,
      url,
      license: `${e.license?.type ?? "CC0-1.0"} (data); the mark is its owner's trademark`,
      added: today(),
      note: e.guidelines ? `usage: ${e.guidelines}` : `brand colour #${e.hex}`,
    },
  };
}

// ---------- the set ----------

function save(lucideIcons: Record<string, Icon>) {
  const brand: Record<string, Icon> = readJson(BRAND, {});
  writeJson(OUT, sortObj({ ...lucideIcons, ...brand }));
  writeSourcesMd();
  console.log(
    `system/icons/icons.json: ${Object.keys(lucideIcons).length + Object.keys(brand).length} icons`,
  );
}

function writeSourcesMd() {
  const sources: Record<string, Source> = readJson(SOURCES, {});
  const rows = Object.entries(sortObj(sources))
    .map(
      ([n, s]) =>
        `| \`${n}\` | ${s.source} | ${s.ref} | ${s.url.startsWith("http") ? `[link](${s.url})` : s.url} | ${s.license} | ${s.added} | ${s.note ?? ""} |`,
    )
    .join("\n");
  writeFileSync(
    SOURCES_MD,
    `# Icon sources\n\nGenerated by \`scripts/icons.ts\` from \`icon-sources.json\`; do not edit by hand.\n` +
      `Vendor marks are kept as published and name the vendor's product only.\n\n` +
      `| Icon | Source | Version | File | Licence | Added | Note |\n|---|---|---|---|---|---|---|\n${rows}\n`,
  );
}

function lucideNames(): string[] {
  const sources: Record<string, Source> = readJson(SOURCES, {});
  const recorded = Object.entries(sources)
    .filter(([, s]) => s.source === "lucide")
    .map(([n]) => n);
  return [...new Set([...CURATED, ...recorded])].filter((n) => !(n in ALIASES));
}

function rebuild() {
  const icons: Record<string, Icon> = {};
  const sources: Record<string, Source> = readJson(SOURCES, {});
  for (const n of lucideNames()) {
    icons[n] = lucide(n);
    sources[n] ??= lucideSource();
  }
  for (const [alias, target] of Object.entries(ALIASES)) {
    icons[alias] = icons[target];
    sources[alias] ??= { ...lucideSource(), note: `alias of ${target}` };
  }
  writeJson(SOURCES, sortObj(sources));
  save(icons);
}

function currentLucide(): Record<string, Icon> {
  const all: Record<string, Icon> = readJson(OUT, {});
  const brand: Record<string, Icon> = readJson(BRAND, {});
  return Object.fromEntries(Object.entries(all).filter(([k]) => !(k in brand)));
}

async function find(q: string) {
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const hits: Record<string, Hit[]> = { odyssey: [], thesvg: [], simple: [], lucide: [] };
  for (const n of await odysseyNames())
    if (re.test(n)) hits.odyssey.push({ id: `odyssey:${n}`, title: n, detail: "Okta product icon" });
  for (const e of await thesvgIndex())
    if (re.test(e.slug) || re.test(e.title) || e.aliases?.some((a) => re.test(a)))
      hits.thesvg.push({
        id: `thesvg:${e.slug}`,
        title: e.title,
        detail: `variants: ${Object.keys(e.variants).join(", ")}`,
      });
  for (const e of await simpleIndex())
    if (re.test(e.slug) || re.test(e.title))
      hits.simple.push({ id: `simple:${e.slug}`, title: e.title, detail: `#${e.hex}` });
  for (const f of readdirSync(lucideDir().dir))
    if (f.endsWith(".mjs") && re.test(f))
      hits.lucide.push({
        id: f.replace(/\.mjs$/, ""),
        title: "",
        detail: "add with: okta-diagrams icons add",
      });
  // Best first: an exact slug or title, then a prefix, then the shortest name.
  const ql = q.toLowerCase().replace(/\s+/g, "-");
  const score = (h: Hit) => {
    const slug = h.id.split(":").pop()!.toLowerCase();
    const title = h.title.toLowerCase().replace(/\s+/g, "-");
    return (
      (slug === ql || title === ql ? 0 : slug.startsWith(ql) || title.startsWith(ql) ? 1 : 2) * 1000 +
      slug.length
    );
  };
  if (!Object.values(hits).some((l) => l.length))
    console.log(
      `no icon matches "${q}" in Odyssey, theSVG, Simple Icons or Lucide.\nFor a vendor, save the logo SVG from its site, then: okta-diagrams icons add-brand file:<logo.svg> --as <name> --from <page URL> [--mono]`,
    );
  for (const [src, list] of Object.entries(hits)) {
    if (!list.length) continue;
    list.sort((a, b) => score(a) - score(b));
    console.log(`\n${src} (${list.length})`);
    for (const h of list.slice(0, 25)) console.log(`  ${h.id.padEnd(36)} ${h.title.padEnd(24)} ${h.detail}`);
    if (list.length > 25) console.log(`  … ${list.length - 25} more`);
  }
  const have: Record<string, Icon> = readJson(OUT, {});
  const local = Object.keys(have).filter((n) => re.test(n));
  if (local.length) console.log(`\nalready in the set: ${local.join(", ")}`);
}

async function addBrand(spec: string, as?: string, color = false) {
  const [source, slug, variant] = spec.split(":");
  if (!slug) throw new Error(`use <source>:<slug>, e.g. thesvg:splunk, simple:kong, odyssey:Lock`);
  let got: { icon: Icon; src: Source };
  let name: string;
  if (source === "odyssey") {
    got = await odyssey(slug);
    name = `okta-${kebab(slug)}`;
  } else if (source === "thesvg") {
    got = await thesvg(slug, variant ?? "default");
    name = variant && variant !== "default" ? `${slug}-${kebab(variant)}` : slug;
  } else if (source === "simple") {
    got = await simple(slug, color);
    name = slug;
  } else if (source === "file") {
    const file = spec.slice("file:".length);
    if (!as || !from)
      throw new Error("file: needs --as <name> and --from <the vendor page the mark came from>");
    const { viewBox, body } = parseSvg(readFileSync(file, "utf8"));
    got = {
      icon: { viewBox, kind: mono ? "fill" : "color", body: mono ? monochrome(body) : body },
      src: {
        source: "vendor",
        ref: from,
        url: from,
        license: "the mark is its owner's trademark; taken from the vendor's site",
        added: today(),
      },
    };
    name = as;
  } else throw new Error(`unknown source "${source}": odyssey, thesvg, simple or file`);
  name = as ?? name;
  const brand: Record<string, Icon> = readJson(BRAND, {});
  const sources: Record<string, Source> = readJson(SOURCES, {});
  brand[name] = { ...got.icon, body: namespaceIds(got.icon.body, name) };
  sources[name] = got.src;
  writeJson(BRAND, sortObj(brand));
  writeJson(SOURCES, sortObj(sources));
  save(currentLucide());
  console.log(`added ${name} (${got.icon.kind}) from ${got.src.url}`);
}

// ---------- command line ----------

const argv = process.argv.slice(2);
// Errors are for people: the message, no stack trace.
const fail = (e: unknown) => {
  console.error(`okta-diagrams icons: ${(e as Error)?.message ?? e}`);
  process.exit(1);
};
process.on("uncaughtException", fail);
process.on("unhandledRejection", fail);
const flag = (f: string) => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv.splice(i, 2)[1] : undefined;
};
const as = flag("--as");
const color = argv.includes("--color") ? (argv.splice(argv.indexOf("--color"), 1), true) : false;
const mono = argv.includes("--mono") ? (argv.splice(argv.indexOf("--mono"), 1), true) : false;
const from = flag("--from");
const [cmd, ...args] = argv;

if (cmd === "list") {
  const icons: Record<string, Icon> = readJson(OUT, {});
  const sources: Record<string, Source> = readJson(SOURCES, {});
  for (const [k, v] of Object.entries(icons))
    console.log(`${k.padEnd(28)} ${v.kind.padEnd(7)} ${sources[k]?.source ?? "?"}`);
  const local: { icons: Record<string, Icon>; sources: Record<string, Source> } = readJson(LOCAL, {
    icons: {},
    sources: {},
  });
  for (const [k, v] of Object.entries(local.icons))
    console.log(`${k.padEnd(28)} ${v.kind.padEnd(7)} ${local.sources[k]?.source ?? "?"} (local)`);
} else if (cmd === "find") {
  if (!args[0]) throw new Error("usage: okta-diagrams icons find <query>");
  await find(args.join(" "));
} else if (cmd === "add") {
  const icons = currentLucide();
  const sources: Record<string, Source> = readJson(SOURCES, {});
  for (const n of args) {
    icons[n] = lucide(n);
    sources[n] = lucideSource();
  }
  writeJson(SOURCES, sortObj(sources));
  save(icons);
} else if (cmd === "add-brand") {
  if (!args[0])
    throw new Error(
      "usage: okta-diagrams icons add-brand <source>:<slug>[:<variant>] [--as <name>] [--color]",
    );
  for (const a of args) await addBrand(a, args.length === 1 ? as : undefined, color);
} else if (cmd === "remove") {
  const brand: Record<string, Icon> = readJson(BRAND, {});
  const sources: Record<string, Source> = readJson(SOURCES, {});
  const icons = currentLucide();
  for (const n of args) {
    delete brand[n];
    delete sources[n];
    delete icons[n];
  }
  writeJson(BRAND, sortObj(brand));
  writeJson(SOURCES, sortObj(sources));
  save(icons);
} else if (cmd === "keep-local") {
  if (!args[0]) throw new Error("usage: okta-diagrams icons keep-local <name>...");
  const brand: Record<string, Icon> = readJson(BRAND, {});
  const sources: Record<string, Source> = readJson(SOURCES, {});
  const icons = currentLucide();
  const local: { icons: Record<string, Icon>; sources: Record<string, Source> } = readJson(LOCAL, {
    icons: {},
    sources: {},
  });
  for (const n of args) {
    const ic = brand[n] ?? icons[n];
    if (!ic) throw new Error(`no icon "${n}" in the shared set`);
    local.icons[n] = ic;
    if (sources[n]) local.sources[n] = sources[n];
    delete brand[n];
    delete sources[n];
    delete icons[n];
  }
  writeJson(LOCAL, { icons: sortObj(local.icons), sources: sortObj(local.sources) });
  writeJson(BRAND, sortObj(brand));
  writeJson(SOURCES, sortObj(sources));
  save(icons);
  console.log(`kept ${args.length} icon(s) in system/icons/local-icons.json`);
} else if (!cmd) {
  rebuild();
} else {
  console.error(`unknown command "${cmd}"; see the header of scripts/icons.ts`);
  process.exit(2);
}
