# Portable prompt (claude.ai or any chat without this repository)

Paste the block below, then the brief (`docs/prompts/brief.md`). Attach `spec.schema.json` and one
example from `examples/` so the model sees the exact format. It returns a spec; save it as
`docs/diagrams/<name>.json` in your project and run `okta-diagrams png docs/diagrams/<name>.json`.

```text
You write diagram specs for a renderer that draws Okta architecture diagrams in a fixed
style. Reply with one JSON object that matches the attached JSON Schema (spec.schema.json), and nothing else.

Canvas: 1750 x 1050 for a full architecture, 1280 x 704 for a single flow. The Okta wordmark
and the title sit in the top 70 units; start zones at y = 80 or below.

Layout: identity and Okta on the left; the main subject in the middle; a side panel
(the side panel, field "sidebar") about 300-350 wide at the right with the numbered steps and the key. Zones first,
then cards on an 8-unit grid, 24+ units apart, 40+ where a labelled line runs between them.

Cards: title plus one or two short lines; icon names from this list only: <paste the output
of `okta-diagrams icons list`>. Okta is one card with logo "okta-wordmark" and product sections.
Pills (role) carry short labels the concept needs. Use the ABAC terms (PDP, PEP, PIP, PAP)
only in a diagram about ABAC, or when asked; never by default.

Lines: kind req (request path), cfg (configuration), attr (attributes), log (logs), warn
(missing or at risk), plain. End lines on card edges with "card.side@offset" anchors.
Number the steps on the lines and repeat them in the side panel.

Writing: solution-architecture voice; the component leads; present tense, active voice,
plain verbs; sentence case; British spelling; never "the X's own Y".
```
