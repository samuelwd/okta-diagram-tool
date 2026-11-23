# okta-diagrams: agent instructions

The tool that draws Okta architecture and concept diagrams in an Okta-inspired style. Read this file
before changing the tool. To make a diagram, follow the `okta-diagrams` skill instead
(`.claude/skills/okta-diagrams/SKILL.md`, linked from `~/.claude/skills/` so every project
has it).

## Documents

| Document | Its job |
|---|---|
| `README.md` | Start here |
| `.claude/skills/okta-diagrams/SKILL.md` | Making a diagram |
| `docs/DESIGN-SYSTEM.md` | How the system is built, and the terms every document uses |
| `docs/STYLE.md` | The look and where it came from |
| `docs/WRITING.md` | The words |
| `AGENTS.md` | Changing the tool (this file) |

Each fact lives in one document; the others point to it. When you change a command, a path or
a term, change it in that one place and check the others still point the right way.

## Setup

Needs [Bun](https://bun.sh) 1.4 or later and `~/.local/bin` on your `PATH`. Clone the repository
to `~/okta-diagram-tool` (the skill's paths name that folder), then:

```sh
cd ~/okta-diagram-tool || exit
bun install
bunx playwright-core install chromium   # the browser for --check, --pdf and the snapshot test
mkdir -p ~/.local/bin ~/.claude/skills
printf '#!/bin/sh\nexec bun %s/src/cli.ts "$@"\n' "$PWD" > ~/.local/bin/okta-diagrams
chmod +x ~/.local/bin/okta-diagrams
ln -sfn "$PWD/.claude/skills/okta-diagrams" ~/.claude/skills/okta-diagrams
okta-diagrams png examples/token-flow.json   # writes out/token-flow.png
```

PNGs and slides need no browser; skip the Chromium step if you only export. On a machine whose
`~/.cache/ms-playwright` is shared with other projects, leave the install out and check the
build `playwright-core` names is already there.

## Layout

`system/` is the design system as a library (`docs/DESIGN-SYSTEM.md`); `src/` and `scripts/` are
the tools around it.

| Path | Role |
|---|---|
| `system/index.ts` | The library's public API (`import … from "okta-diagram-tool"`) |
| `system/schema.ts` | The spec in zod: validation, types, `spec.schema.json` |
| `system/tokens/` | Spacing (`layout.ts`), type scale (`type.ts`), line kinds (`kinds.ts`), palette (`palette.ts`) |
| `system/themes/` | One CSS file of variables per theme |
| `system/styles/` | `components.css` (every component, from the variables) and `base.css` (page and export) |
| `system/components/` | One module per component: card, chip, line, panel, key, icon, highlight, diagram |
| `system/layouts/place.ts` | Placement helpers for TypeScript specs |
| `system/rules/` | `geometry.ts` (the layout audit, run in the browser) and `writing.ts` (the text checks) |
| `system/icons/` | The icon set, and each icon's source and licence (`ICON-SOURCES.md`) |
| `system/fonts/` | DM Sans v17 (OFL): the variable woff2 for measurement, static TTFs for resvg |
| `system/web/okta-diagram.ts` | The `<okta-diagram>` element |
| `src/cli.ts` | The `okta-diagrams` command |
| `src/render.ts`, `export.ts`, `raster.ts`, `test.ts`, `browser.ts`, `fonts.ts` | Render, export, PNG without a browser (resvg), snapshot test, the browser check, exact measurement |
| `scripts/` | Icon set (`icons.ts`), specimen, schema, browser bundle (`build.ts`) |
| `examples/` | Worked specs; each one is a regression test |
| `tests/snapshots/` | The expected image of each example in each theme |
| `docs/` | The design system, style and writing guides; prompts for chats without the tool; `web-demo.html`, a page using `<okta-diagram>` (after `okta-diagrams build`) |
| `out/`, `dist/`, `.cache/` | Generated (the specimen goes to `out/specimen/`); git ignores them |
| `diagrams/` | Your own diagrams that belong to no other project; git ignores it |

## Rules

- Run `okta-diagrams verify` after any change to `system/`, `src/`, `scripts/` or the icon
  set: type-check, lint (oxlint), format check (oxfmt; `bun run format` fixes it), the snapshot test (every example in both themes, compared pixel by
  pixel) and the specimen. A failed comparison writes `out/test/<name>.diff.png`: look at it.
  Accept a change with `okta-diagrams test --update` only when you meant it, and report which
  snapshots moved and why.
- A new example goes in `examples/`; the next test run writes its first snapshot. Look at it
  before keeping it.
- The library stays free of file access (`node:fs`, `node:path`) so it runs in a browser:
  files are read and written in `src/` and `scripts/` only.
- Every spacing is a named value in `DEFAULT_TOKENS` (`system/tokens/layout.ts`), never a bare
  number in a component.
- A new theme is one CSS file of variables in `system/themes/`, its name in `THEMES`
  (`system/schema.ts`) and its import in `system/styles/index.ts`. Line kinds keep their
  meaning in every theme.
- Icons come only through `okta-diagrams icons`, so each one's source is recorded. A mark
  that should not be shared (a customer's or an agency's) goes to
  `system/icons/local-icons.json` with `okta-diagrams icons keep-local <name>`: git ignores
  that file, and the tools still draw its icons. Vendor
  marks are official marks, kept as published. The pins (theSVG commit, Simple Icons and
  Odyssey versions) sit at the top of `scripts/icons.ts`; move one deliberately.
- Text measurement reproduces Chromium on Linux (`src/fonts.ts`); if the export browser or
  the font changes, re-check it against the browser before trusting wraps.
- PNGs come from resvg (`src/raster.ts`): the theme's variables are resolved and the canvas
  background and shadow are drawn in SVG. A CSS feature resvg lacks (it reads no `var()`,
  no `font:` shorthand, no `rx` in CSS) is translated there; the snapshot test compares
  these PNGs, so a mistranslation shows up as a failed snapshot.
- The browser (`playwright-core`, the Chromium build in `~/.cache/ms-playwright`) runs the
  layout check, `--pdf` and the snapshot test only. Install it once at setup, and never on a
  machine where other projects share that cache. Where browser runs must take turns, set
  `OKTA_DIAGRAMS_LOCK_CMD` to a command that takes a lock and runs the rest of its arguments
  (`flock /tmp/browser.lock`, say): the snapshot test and `geometry` run under it, and
  `--no-lock` skips it.
- Output goes next to the spec, or to `--out <dir>` (a folder for every command); specs in
  `examples/` write to `out/`.
- Text in documents and diagrams follows `docs/WRITING.md`. Grep `\bown\b` before finishing.
- Keep the tool small: it makes diagrams. A new feature answers a problem a real diagram hit.
- Commit only when asked.
