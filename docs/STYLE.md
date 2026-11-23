# Style reference

An Okta-inspired style for architecture diagrams. See it rendered: `okta-diagrams specimen`
writes `out/specimen/<theme>.html`.

Status labels: **checked** (confirmed from the source or a saved copy),
**supplied** (a reference image or instruction given for the style), **inference** (our
choice or reading).

## Themes

| Theme | Look | Use |
|---|---|---|
| `blue` (default) | Cream cards with a periwinkle layer beneath, on a cobalt gradient canvas; mint, gold, pink and periwinkle lines | The preferred look: the most readable |
| `gradient` | Frosted-glass cards with white text, on a royal-blue canvas with a coral and violet glow; white, orange, mint and periwinkle lines | Closer to okta.com in 2026; less readable at small sizes |

Any spec renders in either theme: `--theme gradient`.

### Light

`theme: "light"`: a near-white canvas with a periwinkle glow in the bottom-right corner and a
hairline edge, ink text, white cards, cobalt accents, and Lora headings. Made for process and concept slides: open cards on the
canvas, a solid cobalt zone for the stage that matters, pills coloured by meaning, a band.

## Sources

| Source | What it gave | Status |
|---|---|---|
| athleticsnyc.com/work/okta (the Athletics case study for Okta's brand) | The 12 brand colours below; the aura as the hinge of the identity; "layered radiance" | checked |
| Okta's signage and billboards | Stacked lighter layers beneath cards and the canvas; a thin gold line for configuration | inference |
| okta.com and okta.com/oktane, 21 Nov 2026 | Aeonik type; `#0131ff`, `#3f59e4`, `#1a31a9`, `#b6caff`, `#9921fe`, `#ff6217`, creams `#fbfbfa`/`#fffefa`; gradient `55.51deg #1a31a9 → #3f59e4 → #b6caff`; radii 16 and 24 px | checked (saved stylesheets); the screenshot reading is inference |
| DM Sans (Google Fonts, OFL) | All text | chosen |
| Okta Odyssey icons (`@okta/odyssey-react-mui`, Apache-2.0) | The `okta-*` product icons | checked |
| theSVG (glincker/thesvg) and Simple Icons | Vendor marks, the Okta aura | checked |
| okta.com | The Okta wordmark | checked |
| Lucide (ISC, `system/icons/LUCIDE-LICENSE`) | Line icons for generic parts | lucide-react 1.77.0 |

Not sourced: Okta's logo-usage rules (clear space, minimum size, colour versions).
The wordmark follows the text colour by our choice.

## Colour

Okta's palette, from the Athletics case study (athleticsnyc.com/work/okta):

| Blues | Teals | Creams | Neutrals |
|---|---|---|---|
| `#1A31A9` cobalt | `#096256` | `#E8DCC7` | `#191919` ink |
| `#3F59E4` blue | `#4CB7A3` | `#F6F1E7` page | `#6B665F` muted |
| `#B6C9FF` periwinkle | `#B1E4DE` | `#FFFEFA` card | `#AFABA1` |

Rules:

- Brand colour carries the canvas, cards and chips. Lines take contrast colours, chosen
  against the blue, so brand colour is not overused.
- Each line kind has one colour and one meaning in every diagram. Zones get no colour tints.
- Request lines are mint in `blue` and white in `gradient`.

| Kind | Meaning | `blue` | `gradient` |
|---|---|---|---|
| `req` | The request path | mint `#7cf2d6`, 2.2 | white, 2 |
| `cfg` | Configuration | gold `#ffd43b`, 1.8 | orange `#ff8a4c`, 1.8 |
| `attr` | Attributes and identity data | pink `#ff8fb8`, 1.8 | mint `#6ff0d2`, 1.8 |
| `log` | Logs and audit | periwinkle `#b6c9ff`, dashed | periwinkle, dashed |
| `warn` | Missing or at risk | peach `#ffb08a`, dotted | `#ffc29e`, dotted |
| `plain` | Anything else | cream `#e8dcc7` | white at 60% |

## Type

- DM Sans throughout (Google Fonts). It stands in for Aeonik, okta.com's licensed face.
- Sentence case for every label. No spaced uppercase mono.
- Sizes: canvas heading 600 22px; card title 600 16px; card text 400 13.5px; section
  heading 600 13px in cobalt; zone label 600 13px; line label 600 12.5px; side-panel step
  500 13.5px over 400 12.5px; pill 500 10px; pattern tag 600 11.5px.

## Shapes

- Canvas: 24px corners; a stacked lower edge (`0 6px 0 #3f59e4, 0 12px 0 #b6c9ff`). The PNG
  keeps the curved frame and transparent corners.
- Cards: 16px corners; a solid 4px periwinkle layer beneath (the signage stack).
- Zones: a faint fill with a hairline, 24px corners, label top-left or bottom corner.
- One arrowhead size for every line.
- Header: the Okta wordmark top-left, a thin vertical rule, then the title.
- A side panel on the right holds the numbered steps and the key, so the diagram stands alone.

## Components

| Component | Spec | Notes |
|---|---|---|
| Card | `boxes[]` with `title`, `text`, `icon` | Icons top-right; `iconAt: "br"` only when a line takes that corner |
| Pill | `role: "SCIM"` | On the top edge: a short label the concept needs. See "Pills" below |
| Pattern tag | `tag: "AP1"` | Solid cobalt pill, top-right |
| Okta card | `logo: "okta-wordmark"`, `sections[]` | Product sections with Odyssey icons; pills right-aligned per row where a row needs one |
| Icon list | `items[]` | For "one or more of" lists, such as engines |
| Step | `steps[]` on an arrow, or `marks[]` | Numbered circles; pink for an attribute step |
| Side panel | `sidebar` | Steps with short text; a dashed group for steps only some flows take |
| Key | `legend` | Built from what the diagram uses |
| Flow highlight | `flow` on anything, `hl` on a card | Hover a card to light its flow; `--flows` exports one PNG per flow |
| Hub card | `hub: true` | Avoid it: let the arrows show a card's role |
| Note card | `dashed: true` | A dashed outline for a gap, something out of scope or a manual step |
| Key in a row | `legend.layout: "row"` | Along the bottom, for a diagram without a step panel |
| Anything else | `raw` | Hand-written SVG with the theme's classes: a callout, a bracket, a custom shape |

## Icons

Look up in this order; never draw a look-alike of a vendor's mark:

1. An Okta product or concept: Okta's Odyssey icons (`odyssey:<Name>`, named `okta-*`).
2. A vendor or product: its official mark from theSVG (`thesvg:<slug>`), else Simple Icons
   (`simple:<slug>`), else the vendor's site (`file:`, with `--from` the page it came
   from). Never a generic icon in place of a vendor's mark.
3. A generic part: Lucide.

`okta-diagrams icons find <name>` searches all four; every add records source, version and licence
in `system/icons/ICON-SOURCES.md`. Keep a mark only if it reads at 20px; on the gradient theme use
the `:mono` variant of a dark mark.

## Layout

- Lines are right-angled. Curve a line only where right angles cannot route it cleanly
  (spokes fanning out of a hub), and then curve its whole set the same way: one bend, the
  ends mirrored about the hub.
- A map of many parts still shows how things are done (numbered steps on the lines), and
  varies the weight of its parts by role, so it does not read as a grid of equal cards.
- Fit a 16:9 slide reasonably well: a canvas between
  1.6:1 and 1.9:1, about 1750 × 1050 units. A 2:1 canvas leaves bands on the slide. No dead
  bands of whitespace, and nothing condensed.
- Represent Okta as one node; consolidate the rest into single nodes. No file names or
  locations in a diagram. When an Okta product is the subject (Universal Directory, Identity
  Threat Protection), its parts may be separate cards.
- The Okta card is not a product catalogue. List only the products this diagram's point
  needs, two or three rows each. When other cards already show which Okta feature does what,
  the Okta card shrinks to its name and one line.
- Steps: each number appears once, on the line it describes, in that line's kind colour.
  Lines end on a card's edge, never on a zone's edge or in open space.
- Flow left to right and top to bottom: identity on the left, the policy pipeline across the
  top, enforcement patterns in the middle, decisions on the right, the step guide at the far
  right.
- Keep labels off cards and lines off card faces; `okta-diagrams check` enforces both.
- Place each card next to what it relates to. Cards with nothing in common never stack in
  a column for alignment's sake. A line that crosses the
  canvas, or loops round its edge, means a card is in the wrong place: move the card.
- Cards in one zone are split on one axis, and named on it. Applications grouped by how each connects to Okta: SAML and OIDC
  applications, on-premises web applications (Access Gateway), LDAP applications, APIs,
  AD-integrated applications. Never a mix of age, protocol and who built them. A name
  is no narrower than the card.
- Name a component the reader acts on, not the plumbing behind it.
- Okta products are drawn as Okta, never as a generic card. The Okta wordmark appears once, on the hub. Every other Okta card is
  titled with the full product name ("Okta Access Gateway", "Okta Workflows") and carries
  the Okta aura mark (`icon: "okta-aura"`) top right.
- Remove a logo that is unreadable at diagram size.
- Vendor marks go into the icon set (`okta-diagrams icons add-brand`, `file:` for one taken
  from the vendor's site) and are used as card icons, never pasted into a spec as an image.
- Name things what is most natural and technically correct: the product doing the work
  where the product is meant, the company where the company is meant. A term the
  person asking for the diagram states wins.
- Line labels say what moves, in one form on every line. A port appears only where it is
  the exception (LDAPS 636 among HTTPS lines); the key says "Connections use HTTPS 443
  unless marked". Never a port on some lines and not others for
  no reason.
- One name per thing, on one side of the picture: the same concept never appears twice
  under two names.

### Sets of diagrams

- Each diagram in a set gets the composition its message needs. Share a
  frame only where the reader compares two diagrams slot for slot, as before and after do.
- Logos and names are used the same way in every diagram of the set.
- Versions of one diagram (with and without a comparison, detailed and overview) are built
  from one shared base and differ only where the version's purpose needs it.
  Before merging versions, list what each has that the other lacks, so no detail is lost.
- A new version starts from the best accepted version, never from a rejected one.

### The reference for quality

A strong architecture diagram has these qualities: one story
with numbered steps hopping across the canvas; many actors of different kinds and sizes;
lines in several kinds, each labelled with what it carries; verbs and real examples on
cards; a canvas tiled edge to edge.

### Comparison diagrams

When a diagram shows Okta in place of another product:
- Okta takes the other product's place in the picture; the two are not drawn side by side.
- In each slot, pair the other product's feature with the Okta feature that covers it.
- Check each Gap or Limit first (the skill's "Get Okta's capabilities right").
- Give each pairing a status with one meaning, and define the statuses in the key.
- Show the gaps where they occur, including transition risks, not only in a closing list.
- A long feature-by-feature mapping is a table in the document, not a diagram.

### Stories

- Simpler means fewer shapes, never fewer steps: a simpler version keeps the numbered story
  on its lines.
- In a hub layout, each spoke leaves from the hub section that serves it.
- Each step's text matches the line its number sits on. The diagram tells a story: a
  protagonist (a joiner, a request) and numbered steps. An inventory of capabilities with
  arrows reads as a list.

## Writing

The full guide, with before-and-after examples, is `WRITING.md`. In short:

- Solution-architecture voice: "Okta secures these resources with authorization servers,
  issuing tokens when users and agents meet policy defined in Okta. The API then checks the
  token scope/claims as needed."
- The component leads; present tense, active voice, plain verbs. Short labels.
- Never "the X's own Y" (`okta-diagrams check` flags "own"). No "AI prose".
- British spelling in prose; product names keep Okta's spelling (Authorization Server).
- Pills: a short label the concept needs, and only where it helps the reader. The ABAC
  terms (PDP, PEP, PIP, PAP) appear only in diagrams about ABAC, or when asked for; never
  add them by default. In an
  ABAC diagram, Okta's roles tie to a moment ("PDP · PEP" at sign-in and token issue, "PIP"),
  and bare "PDP" means the request-time policy engine.
- Okta's policies are "attribute-conditioned access policies". The token inline hook adds
  claims and makes no access decision.
