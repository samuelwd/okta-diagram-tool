# okta-diagrams

Okta architecture and concept diagrams in an Okta-inspired style. You write a short spec; the tool
lays out the cards, lines, steps and key and writes a PNG (or a 16:9 slide image, or a PDF).
PNGs are drawn directly (resvg); a headless browser runs only for the layout check and PDFs.

![An example: Okta secures customer sign-up, sign-in and APIs](examples/customer-identity.png)

More in [`examples/`](examples/README.md).

```sh
okta-diagrams new docs/diagrams/flow.json      # in any project: a spec from a template
okta-diagrams png docs/diagrams/flow.json      # flow.png next to the spec (--out <dir> elsewhere)
okta-diagrams check docs/diagrams/flow.json    # the layout and writing checks
okta-diagrams png docs/diagrams/flow.json --slide --theme all
okta-diagrams help                             # every command and option
```

`okta-diagrams` is a launcher in `~/.local/bin` for `src/cli.ts` in this folder. After a fresh
clone, follow "Setup" in `AGENTS.md`.

In Claude Code, ask for a diagram ("draw … with okta-diagrams"): the `okta-diagrams` skill
takes it from brief to a checked PNG. Outside Claude Code, use `docs/prompts/portable.md`.

An independent project: not an Okta product, and not affiliated with or endorsed by Okta, Inc.

## Documents

| Document | Its job |
|---|---|
| `README.md` | Start here |
| `.claude/skills/okta-diagrams/SKILL.md` | Making a diagram: the workflow, from brief to composition review |
| `docs/DESIGN-SYSTEM.md` | How the system is built: terms, tokens, components, layouts, rules, the library |
| `docs/STYLE.md` | The look and where it came from: themes, colours, type, icons, layout |
| `docs/WRITING.md` | The words: voice, before and after, rules, checklist |
| `AGENTS.md` | Changing the tool: setup, layout of the code, rules |
| `docs/prompts/` | A brief checklist, and a prompt for chats without this tool |

Examples, each also a regression test: `examples/`. The style reference pages, one per theme:
`okta-diagrams specimen` writes `out/specimen/<theme>.html`.

## Licence

MIT (`LICENSE`). Fonts, icons and trademarks keep their own terms: `THIRD-PARTY-NOTICES.md`.
