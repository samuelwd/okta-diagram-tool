// Writing rules (docs/WRITING.md) that a machine can check. Runs on plain strings, so it lints a
// spec before rendering as well as the text of a rendered page.
import type { Spec } from "../schema";
import type { Issue } from "./geometry";

const RULES: { test: RegExp; what: string }[] = [
  { test: /\bown\b/i, what: 'avoid "own" ("the X\'s own Y")' },
  { test: /[a-z)]: /i, what: "a colon reveal" },
  { test: /;/, what: "a semicolon" },
  { test: /, e\.g\./, what: '", e.g." (write "such as")' },
];

export function writingIssues(texts: string[]): Issue[] {
  const out: Issue[] = [];
  for (const t of texts)
    for (const r of RULES)
      if (r.test.test(t)) out.push({ level: "warn", what: `writing, ${r.what}: "${t.slice(0, 50)}"` });
  return out;
}

// Every string a spec draws on the canvas (not its description, which is prose for screen readers).
export function specTexts(spec: Spec): string[] {
  const out: string[] = [];
  const add = (v: unknown) => (Array.isArray(v) ? v.forEach(add) : typeof v === "string" && out.push(v));
  for (const z of spec.zones ?? []) add(z.label);
  for (const b of spec.boxes ?? []) {
    add(b.title);
    add(b.text);
    add(b.note);
    add(b.role);
    add(b.tag);
    for (const it of b.items ?? []) add(it.text);
    for (const sec of b.sections ?? []) {
      add(sec.heading);
      for (const it of sec.items) add(typeof it === "string" ? it : it.text);
    }
  }
  for (const a of spec.arrows ?? []) add(a.label?.text);
  for (const t of spec.texts ?? []) add(t.text);
  if (spec.sidebar) {
    add(spec.sidebar.title);
    for (const s of spec.sidebar.steps) {
      add(s.title);
      add(s.text);
    }
    for (const g of spec.sidebar.groups ?? []) add(g.label);
  }
  if (typeof spec.heading === "string") add(spec.heading);
  else if (spec.heading !== false) add(spec.title);
  return out;
}
