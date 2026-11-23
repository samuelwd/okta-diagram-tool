# Diagram design system

The design system is code in `system/`. This page describes it; the files are the source.
See it rendered in `out/specimen/<theme>.html`
(`okta-diagrams specimen` builds them from the token files).

It has four layers, and each layer uses only the layers above it:

| Layer | Where | What it holds |
|---|---|---|
| Tokens | `system/tokens/`, `system/themes/` | The values: spacing, type scale, line kinds, palette, and each theme's colours |
| Components | `system/components/`, `system/styles/components.css` | The parts every diagram is drawn from |
| Layouts | `system/layouts/` | How parts are placed on a canvas |
| Rules | `system/rules/`, `STYLE.md`, `WRITING.md` | What a finished diagram must satisfy, checked by machine where possible |

## Terms

Every document uses these words; the spec field is in code.

| Term | Spec field | Meaning |
|---|---|---|
| Spec | the file | A diagram described as JSON, or TypeScript with a default export |
| Canvas | `canvas` | The diagram's area, in viewBox units (1 unit = 1 px at export) |
| Card | `boxes` | A component: title, text, corner icon; optionally a pill, a tag, a list or product sections |
| Zone | `zones` | A labelled area that groups cards; `style: "solid"` makes a filled panel cards sit on, `"none"` keeps only the label; `at: "above"` puts the label over it as a stage label |
| Open card | `variant: "open"` | A large icon, a title and text (often `bullets`) with no card around it: a stage in a process slide |
| Band | `variant: "band"` | A rounded strip: an icon, a bold title and text on one line |
| Pills | `pills`, `pillCols` | A grid of pills in a card, each with a tone: accent, neutral, allow, caution, deny |
| Line | `arrows` | A relationship between two cards, of one kind (`kind`) |
| Line kind | `kind` | What a line carries: `req`, `cfg`, `attr`, `log`, `warn`, `plain` (`tokens/kinds.ts`) |
| Label | `label` | The text on a line |
| Step | `steps`, `marks` | A numbered circle on a line, matching a step in the side panel |
| Side panel | `sidebar` | The numbered steps at the right, in groups where only some flows take them |
| Key | `legend` | What each line kind, step and chip means; in the side panel, or in a row |
| Pill | `role` | A small outlined pill on a card's top edge with a short label; ABAC terms only in ABAC diagrams (`STYLE.md`) |
| Tag | `tag` | A solid pill top-right on a card: AP1 |
| Flow highlight | `flow`, `hl` | Hovering a card keeps its flow lit; `--flows` exports one image per flow |
| Layout values | `tokens` | The named spacings (`tokens/layout.ts`), overridable per diagram or card |

## Tokens

| File | Holds |
|---|---|
| `tokens/layout.ts` | Every spacing in viewBox units (`DEFAULT_TOKENS`): card padding, line spacing, chip padding, step spacing, key rows. A spec overrides any of them (`tokens`), a card for itself (`box.tokens`). |
| `tokens/type.ts` | The type scale: 14 roles (canvas heading, card title, card text, line label, chip ...) with size and weight. The renderer measures text with these sizes, and the stylesheet gets them as `--size-*` variables, so both use one source. |
| `tokens/kinds.ts` | The line kinds and their meanings: `req` request path, `cfg` configuration, `attr` attributes, `log` logs, `warn` missing or at risk, `plain` other. One meaning in every diagram; key labels a spec can rename. |
| `tokens/palette.ts` | The named colours and where each came from (the Athletics case study swatch, okta.com). |
| `themes/blue.css`, `themes/gradient.css`, `themes/light.css` | A theme is a set of CSS variables and nothing else: canvas, cards, lines per kind, chips, steps, panel, key. A new theme is one new file. |

## Components

Each component is a TypeScript function that returns SVG markup with the system's class
names, and a block of `styles/components.css` that draws those classes from the variables.

| Component | Function | Classes |
|---|---|---|
| Card (title, text, icon list, product sections, note, corner icon; hub and dashed variants) | `layBox`, `measure` (`components/card.ts`) | `.box`, `.t`, `.s`, `.gh`, `.gn`, `.ic` |
| Pill and pattern tag | `role`, `tag` (`components/chip.ts`) | `.role`, `.ra` |
| Line: anchors on card edges, elbows or curves (`curve`), arrowheads, label, steps | `layArrow`, `stepSvg` (`components/line.ts`) | `.a.<kind>`, `.lbl.<kind>`, `.step` |
| Zone, panel, free text, raw SVG | `renderSvg` (`components/diagram.ts`) | `.zone`, `.sidepanel`, `.ftext` |
| Side panel with numbered steps and groups | `laySidebar` (`components/panel.ts`) | `.gt`, `.gtitle`, `.gtext`, `.gbox`, `.gtrack` |
| Key, in a column or a row | `layLegend` (`components/key.ts`) | `.legend` |
| Open card, band, pill grid, bullets | `layBox` (`components/card.ts`) | `.box.open`, `.box.band`, `.pill.<tone>`, `.bul` |
| Solid zone, stage label | `renderSvg` | `.zone.solid`, `.zone.above` |
| Heading with the Okta wordmark | `renderSvg` | `.brandmark`, `.dtitle` |
| Icon (Lucide, Odyssey, theSVG, Simple Icons; 116 in `icons/`) | `icon` (`components/icon.ts`) | `.ic`, `.oi`, `.wm` |
| Highlight flows on hover | `attachHighlight` (`components/highlight.ts`) | `.fl`, `.hov`, `.on` |

## Layouts

| Layout | Where | Use |
|---|---|---|
| Hand placement | the spec | Exact `x`, `y`, `w`, `h`; anchors `"card.side@offset"`; waypoints |
| Relative placement | `layouts/place.ts` | `below`, `rightOf`, `column`, `row`, `zoneAround`, `bottom` in a TypeScript spec |

Tried and dropped (22 Nov 2026): automatic layout with elkjs. Given the cards, zones and links
of two full architecture diagrams, it produced valid layouts (no overlaps, right-angled
lines) that were 4:1 strips with the structure lost: Okta in the middle, the pipeline at the
bottom. Column pinning (partitions) does not stack cards, and a zone laid out in a separate
pass with its direction cannot take lines into its cards.
Curated architecture slides keep hand placement with the helpers.

## Rules

| Rule set | Where | Checked |
|---|---|---|
| Layout: text inside cards, no overlaps, text clear of steps and icons, lines off cards and off text, everything on the canvas | `rules/geometry.ts` | In a headless browser: `check`, `png --check`, and every test |
| Writing: no "own", colon reveals, semicolons or ", e.g." in diagram text | `rules/writing.ts` | On every export and test, and on a spec before rendering (`specTexts`) |
| Spec shape: every field, ids unique, anchors name real cards | `schema.ts` (zod) | On every load; `spec.schema.json` gives editors autocomplete |
| Style: colour use, icons, composition | `STYLE.md` | By review (the skill's composition review) |
| Writing voice | `WRITING.md` | By review |

## Using it

**In TypeScript** (Bun, Node or a browser bundle):

```ts
import { parseSpec, renderSvg, stylesheet } from "okta-diagram-tool";
const svg = renderSvg(parseSpec(json));   // SVG with the system's classes
const css = stylesheet("blue");           // the CSS that styles it
```

**In any HTML page**, after `okta-diagrams build`:

```html
<script type="module" src="dist/okta-diagram.js"></script>
<okta-diagram src="examples/token-flow.json" theme="gradient"></okta-diagram>
```

The element validates the spec, renders it in a shadow root (page styles and diagram styles
never mix), loads the fonts and wires the hover highlight. `docs/web-demo.html` shows both
themes on one page.

**Hand-written SVG:** link `dist/blue.css` and use the classes above.

**Files:** `okta-diagrams png` (PNG and slide drawn by resvg, no browser; `--pdf` uses the
browser), `okta-diagrams check`, `okta-diagrams render`. Output goes next to the spec, or to
`--out <dir>`.

## Changing the system

- A value: edit the token file. A new spacing goes into `DEFAULT_TOKENS`, never as a bare
  number in a component.
- A colour: edit the theme's variable. A new theme: copy a theme file and change values.
- A component: a function in `components/` plus its block in `components.css`, using
  variables only; add it to the specimen.
- After any change: `okta-diagrams verify` (type-check, the snapshot test, the specimen), and
  look at what moved.
