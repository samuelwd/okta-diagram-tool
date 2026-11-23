---
name: okta-diagrams
description: Draw an architecture or concept diagram in the Okta Blue style (cream cards on a cobalt canvas, mint/gold/pink/periwinkle flow lines, DM Sans, Okta wordmark header, numbered step panel and key), or the Okta Gradient style, with official vendor logos and Okta product icons, and export it as HTML, PNG, a 16:9 slide image or PDF. Use when asked for a diagram, architecture picture, flow, slide image or visual of an Okta setup or technical concept, or mentions "okta-diagrams".
---

# Okta diagrams

The tool is the `okta-diagrams` command (`okta-diagrams help`; source and documents in
`~/okta-diagram-tool`). It works from any folder: a diagram's spec lives in the project it
belongs to (for example `docs/diagrams/`), and its PNG, slide and HTML are written next to it.

A diagram is a spec: JSON, or TypeScript using the placement helpers. The renderer lays out
the cards, lines, steps and key; the export draws PNG or slide images directly (no
browser); the check opens the page in a headless browser to find collisions. Before the first diagram of a session, read `~/okta-diagram-tool/docs/STYLE.md` (the
look) and `~/okta-diagram-tool/docs/WRITING.md` (the words). The terms used below (card, line, zone,
key, side panel, step) are defined in `~/okta-diagram-tool/docs/DESIGN-SYSTEM.md`, "Terms".

## Get Okta's capabilities right

A diagram that calls something Okta does a gap or a limit is a serious error. Okta's
capabilities often come from combining features, not from one feature's page. Before a card,
pill, label or step says Okta cannot do something, check the building blocks that could cover
it, and say which you checked: Okta Workflows (event, scheduled and API endpoint flows,
connectors, the API Connector card), Okta Expression Language, inline and event hooks,
Universal Directory (profile mappings and sourcing), import matching and group rules,
directory integration (AD and LDAP agents, delegated authentication, the LDAP Interface),
Okta Access Gateway, Identity Governance, the management APIs and System Log.

- Gap: only what no combination covers. Limit: the card states the limit, and a source
  backs it. A page you could not find means "not checked", never "not possible".
- Something built from these building blocks is configured in Okta: a plain Okta card.
- A Limit pill sits on what is limited (the application, the relationship), not on the Okta
  feature that does the work.
- Okta products are drawn as Okta, never as a generic card: the wordmark once, on the hub;
  every other Okta card titled with the full product name and the aura mark
  (`icon: "okta-aura"`) top right. The tool draws it black, like the wordmark.
- A status is a status: "✅ Supported" when Okta does it, with the method in the next
  column. A method or reason in the status column ("➡️ Headers", "Web only") reads as
  partial support.
- A picture about one Okta product keeps that product in its title and columns. The rest
  of Okta stays in, set apart (a tagged "Other Okta" line).

## Three ways to work

Pick the lightest one that gets the picture right; the check and the export work on all three.

1. **Spec only.** The renderer lays everything out from its defaults. Most diagrams.
2. **Spec with overrides.** Hand-place anything: exact `x`, `y`, `w`, `h`, label `at`, step
   `at`, waypoints; change any spacing for the diagram (`tokens`) or one card
   (`box.tokens`, e.g. `{ "padX": 18, "titleY": 32 }`); a zone label inset (`labelX`); `raw`
   SVG for shapes the renderer does not draw. The values and defaults are
   `DEFAULT_TOKENS` in `system/tokens/layout.ts`.
3. **A hand-written slide**, for what is not cards and lines: an `.svg` with a viewBox and
   `<icon name=… x y size/>` for icons; the tool draws the canvas behind it (format:
   `src/slide.ts`). Colours and fonts come only from the theme's variables (`var(--ink)`,
   `var(--card-fill)`, `var(--heading-family)`), so one file takes every theme
   (`--theme all`). Export it with `okta-diagrams png slide.svg`.

A long comparison across many cases is a table in a document, not a diagram.

## Workflow

1. **Brief.** From the request, settle: the one sentence the diagram proves; the audience;
   the components (Okta as one node, everything else consolidated); the flows and which line
   kind each is; the numbered steps; any per-pattern highlights. State the defaults you take
   and proceed. `docs/prompts/brief.md` is the checklist.
2. **Picture concept, before any coordinates.** For a new subject, a set of diagrams, or
   after one is rejected: send the concept in words first (the one sentence
   it proves, the protagonist, the numbered steps, a rough ASCII layout) and wait for a yes.
   Build one diagram of a set and show it before the others. Write one line saying what shape the main
   subject takes on the canvas, then sketch it. The shape follows the idea, not the content
   list: a file with a header and a payload is drawn as a header above a payload; a flow is a
   line of cards; a hierarchy is a tree. A card with stacked sections suits a product's
   feature list (the Okta card) and little else. One line per relationship.
3. **Icons.** List the icon each card needs and get any that are missing (below) before
   writing the spec.
4. **Lay out.** Pick the canvas: 1750 × 1050 for a full architecture, 1280 × 704 for a single
   flow (both fit a 16:9 slide). Identity and Okta on the left, the main subject in the
   middle, the step panel (300–350 wide) at the right; or, without a step panel, a key in a
   row along the bottom (`legend.layout: "row"`). Zones first, then cards on an 8-unit grid,
   24+ units apart, 40+ where a labelled line runs between them.
5. **Write the spec**: `okta-diagrams new docs/diagrams/<name>.json`, or `<name>.ts` to place
   cards relative to each other with the helpers (`below`, `rightOf`, `column`, `row`,
   `zoneAround`, `bottom`). Templates (`--from`): `token-flow`, `scim-provisioning`,
   `customer-identity`, `workforce-identity`, `enterprise-identity-hub`. The examples behind
   them (`examples/README.md` shows each one):
   - `token-flow.json`: a single flow with a step panel;
   - `scim-provisioning.ts`: the layout helpers, vendor marks, a dashed card and a row key;
   - `customer-identity.json`: a full architecture with zones, highlight flows and a step
     group in the side panel;
   - `workforce-identity.json`: a full architecture with many application patterns and a
     side panel of lifecycle steps;
   - `enterprise-identity-hub.json`: a hub with spoke orgs, partners and edge sites, and a
     row of steps along the bottom;

   A process or concept slide is not an architecture: use open cards for its stages, not
   cards. When given a slide to replicate, keep its layout, wording and visual
   devices; the style is the colours and type, not cards and side panels.

   Every field is described in `system/schema.ts`. A JSON spec made with `new` points its
   `$schema` at the tool, so editors autocomplete it; every spec is validated when it loads.
6. **Export and check:**
   ```sh
   okta-diagrams png docs/diagrams/<name>.json --check   # check, then <name>.png at 2x, next to the spec
   ```
   `png` alone draws without a browser in under a second; `--check` adds the layout check
   (a headless browser, a second or two). `okta-diagrams check` runs the check alone.
7. **Look at the PNG** with the Read tool. Fix every ERROR line, then anything that reads
   badly: labels crowding steps, lines crossing, cramped cards, a logo you cannot read at
   card size. The check catches collisions; only looking catches a bad picture.
   **Place by numbers, not by eye.** The PNG you look at is scaled down, so its pixels are
   not canvas units. Before moving anything, run `okta-diagrams geometry x.json`: it lists
   every card, label, key, step and line position in canvas units, and the free rectangles
   left. Put the element in a free rectangle, with `x`/`y` (the key: `legend.x`, `legend.y`).
   A key is apart from the content: in a canvas corner the request names, in free space, never
   in a gap between cards or lines.
8. **Composition review.** A clean check is not done. Answer each, and redraw (not patch)
   on any no:
   - Does the main subject's shape show the idea from step 2 at a glance?
   - Does something happen? A protagonist and numbered steps, not an inventory of parts.
   - Is there dead space: an empty card, an empty band in a zone, a panel ending far below
     its content? Fill it by changing the layout, never by stretching a card.
   - Does every card earn its place, and every line show one relationship? Is the Okta card
     a catalogue that repeats what other cards say?
   - Does the canvas sit between 1.6:1 and 1.9:1? Does each step number appear once, and
     does every line end on a card?
   - Does any pill or card say Okta cannot do something? Run "Get Okta's capabilities
     right" above first.
   - Does the picture still answer the question asked? A redraw for elegance keeps the
     content that answered it.
   - Does the text pass `docs/WRITING.md` (no slogans, colon reveals, appositives, asides)?
   When a diagram "needs work", run this review on the whole diagram, not only on the
   part pointed at. A correction changes what was criticised; do not swing to the
   opposite extreme.
9. **Report** the paths of the files just written, and delete stale copies elsewhere. Offer the variants below rather than making them all.

## Icons

Look up in this order, and never draw a look-alike of a vendor's mark. A vendor card always
gets the vendor's real mark: when no library has it, take it from the vendor's site (the
inline logo SVG or the press kit) rather than falling back to a generic icon.

| Need | Source | Command |
|---|---|---|
| An Okta product or concept | Okta's Odyssey icons | `okta-diagrams icons add-brand odyssey:IdentityGovernance` (named `okta-identity-governance`) |
| A vendor or product | theSVG, the official mark | `okta-diagrams icons add-brand thesvg:splunk` (`:mono`, `:wordmark` variants) |
| A vendor theSVG lacks | Simple Icons | `okta-diagrams icons add-brand simple:kong` (`--color` for its brand colour) |
| A vendor no library has | The vendor's site: the logo SVG in its page or press kit, saved to a file | `okta-diagrams icons add-brand file:acme.svg --as acme --from https://www.acme.example/` (`--mono` for a one-colour mark) |
| A generic part | Lucide | `okta-diagrams icons add server-cog` |

`okta-diagrams icons find <name>` searches all four; `okta-diagrams icons list` shows what the set has.
A mark that should stay on this machine (a customer's or an agency's): add it, then
`okta-diagrams icons keep-local <name>` moves it to `system/icons/local-icons.json`, which git ignores.
Each add records its source, version and licence in `system/icons/ICON-SOURCES.md`. On the gradient
theme a dark colour mark (GitHub, Okta) reads poorly on glass: add its `:mono` variant.
A mark wider than tall is fitted into the icon's square, so a wordmark turns small. For an
organisation, use its seal or square mark rather than its wordmark.

Never paste a logo, seal or flag into a spec as raw SVG. Add it to the set with `add-brand
file:` (with `--from`, the page it came from) and name it on a card. A pasted mark makes the
spec too large to read, gets copied into every diagram of a set,
escapes the layout check and leaves no source on record. The check warns on a spec over
500 KB and on a raw layer over 20 KB or one with an embedded image.

## Export options

```sh
okta-diagrams png x.json --slide            # 1920 x 1080 slide image on the page colour
okta-diagrams png x.json --slide --scale 2  # 4K slide
okta-diagrams png x.json --theme gradient   # the Okta Gradient look (--theme all: both)
okta-diagrams png x.json --scale 3          # print density
okta-diagrams png x.json --flows            # also one image per highlight flow (slide builds)
okta-diagrams png x.json --flow ap3         # only that flow lit
okta-diagrams png x.json --flat             # square corners, no shadow, no margin
okta-diagrams png x.json --bg               # page background instead of transparent
okta-diagrams png x.json --pdf              # also a vector PDF
okta-diagrams check x.json                  # checks only
okta-diagrams geometry x.json               # positions and free space, in canvas units
okta-diagrams render x.json                 # HTML only: x.html (hover to highlight)
```

## Spec essentials

- Anchors: `"card.side@offset"` puts a line end on a card edge (offset in px from the left or
  top of that side, or `"30%"`). Elbows are added between points that differ in x and y; add
  waypoints `[x, y]` to steer.
- `curve: true` on a line draws a smooth curve instead of elbows (hub and spoke): it leaves
  and meets card sides square, and waypoints shape it; a number (0-1, default 0.4) sets how
  far it holds each end's direction. Right angles are the default; curve only where they
  cannot route cleanly, with one bend for the whole set, mirrored (docs/STYLE.md, Layout).
- Line kinds keep one meaning everywhere: `req` request path, `cfg` configuration, `attr`
  attributes, `log` logs, `warn` missing or at risk, `plain` anything else.
- Card text: a string wraps; an array sets the lines. Prefer arrays once the layout settles.
- `dashed: true` draws a note card: a gap, something out of scope, a manual step.
- `marks: [...]` draws a row of small marks under a card's title (the seals of the organisations
  it stands for) and moves the text down; `badges: [...]` adds marks in the top-right corner,
  left of the icon, with `"/"` for a thin divider (`["okta-aura", "/", "shield-check"]`: Okta or
  another identity provider). Both are checked like the card icon (`examples/card-marks.json`).
- `raw: [{ svg, layer, flow }]` passes hand-written SVG through for anything the renderer
  does not draw (a callout, a custom shape, a bracket; never a logo, see Icons); use the theme's classes so it follows
  the theme (`system/schema.ts`, `Raw`). The audit checks its text like any other.
- Hand placement wins: give exact `x`, `y`, `w`, `h`, label `at`, step `at` and waypoints
  wherever the defaults are not what you want.
- Labels: give `at` and `anchor` for anything near a step or another line.
- Steps: `steps` on a line (a point or a fraction along it), or `marks` for a step shared by
  several flows. Match the numbers in the side panel (`sidebar.steps`).
- Side panel steps are white unless a step sets `kind`. The key shows
  each step colour used on the lines and any dashed line (rename with `legend.labels`: `stepAttr`,
  `stepCfg`, `dashed`). A line under the key goes in `legend.note`, never as free text.
- Side panel steps are spaced by their text, so the gaps look even. `tokens.stepSpace`
  (default 34) sets the space under each step; `tokens.stepGap` sets a fixed least distance
  between circles.
- Highlights: `flow` on cards, lines, zones and side-panel steps; `hl` on the card that
  lights it; `"all"` stays lit.

## Style rules that matter most

- Readability over brand fidelity: cream cards, ink text, contrast-coloured lines.
- Okta is one node, with product sections. Get Okta's capabilities right (the section above).
- Pills (`role`, `tag`) carry short labels the concept needs. The ABAC terms (PDP, PEP, PIP,
  PAP) appear only in diagrams about ABAC, or when asked for; never by default.
- Icons top-right. Official marks only for vendors; drop a mark that is unreadable at size.
- Sentence case; no spaced uppercase; no hub highlight; no label halos.
- Writing: follow `~/okta-diagram-tool/docs/WRITING.md` (read it before writing labels): human,
  straightforward systems-architecture language; the component leads; present tense; no
  fluff, colon reveals or explained reasoning; never "the X's own Y"; British spelling.

## Diagrams in other pages and apps

The design system is a library (`docs/DESIGN-SYSTEM.md`). In any HTML page, after `okta-diagrams build`:
`<script type="module" src="dist/okta-diagram.js"></script>` and
`<okta-diagram src="spec.json" theme="blue"></okta-diagram>`. In TypeScript:
`import { parseSpec, renderSvg, stylesheet } from "okta-diagram-tool"`.

## Changing the tool itself

Follow `~/okta-diagram-tool/AGENTS.md`: run `okta-diagrams verify` after any change, and accept
a snapshot change (`okta-diagrams test --update`) only when you meant it.

The check uses the Chromium build `playwright-core` names, installed once at setup
(`AGENTS.md`, "Setup").
