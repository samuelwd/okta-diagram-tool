# Writing guide

How text reads in diagrams, docs and app copy.

## The voice

Human, natural systems-architecture language. The model sentence:

> Okta secures these resources with authorization servers, issuing tokens when users and
> agents meet policy defined in Okta. The API then checks the token scope/claims as needed.

- The component leads and does something concrete: "Okta issues", "The gateway validates".
- Present tense, active voice, plain verbs: secures, issues, checks, sends, stores, retrieves.
- Short items. One idea per line in a diagram; one or two sentences per item in a doc.
- Match the rest of the page. A new label takes the form of its neighbours.
- No AI prose and no fluff. A line that would not appear in a real enterprise product does
  not appear in a diagram.

## Before and after

| Before | After | Why |
|---|---|---|
| Authorization server issues a token with scopes/claims | Okta Authorization Server issues an access token with scopes/claims | Name the real product and the exact token |
| Policy engine resolves missing user attributes from Okta | Policy engine retrieves necessary user attributes and context from Okta | Plain verb; say what it fetches |
| OpenID standard API: the PEP sends subject, action and resource and gets allow/deny | Receives allow/deny requests from gateways and apps in the OpenID standard format | The component leads; no colon reveal; no protocol walk-through |
| Generated policies and attribute maps, evaluated on each request | Policies and attribute maps the policy engine uses to decide each request | Say what it is, then its job; drop the passive tail |
| How a request is decided | Authorization flow | A plain heading, not a phrase that explains itself |
| Okta + Dedicated ABAC Architecture | Okta ABAC Architecture with an External Policy Engine | A title that names the parts, without symbols |
| Continuous access (ITP) | In-session risk checks (ITP) | Say what it does |
| Applications by class | Authorization patterns | A term an architect would use |
| HR system | Personnel / agent systems and directories | Covers agents too |
| subject (lower-case badge) | removed; the card says "The subject of each request" | One name per thing; badges share one case |
| Step guides written as explanations, in boxes | Number, short title, two plain lines: "Sign in / Okta authenticates the user or agent against sign-in policy" | Steps are short and subtle |
| runs in any standard policy engine | removed | Fluff |
| An API token has the full rights of the admin who made it, so it can also write. An OAuth service app with read scopes cannot. | An OAuth service app reads with read scopes. An API token carries the full rights of the admin who created it. | State each fact; no spelled-out reasoning, no closing negation |

## Rules

**Cut**

- Fluff: claims of compatibility, reach or quality that a real enterprise product page
  would not carry. If a line does not help someone build or decide, remove it.
- Explanations of reasoning ("so it can", "which means", "this ensures").
- Appositives that restate the subject: "The database, encrypted at rest",
  "Config file, in plain YAML", "Signing key, kept in a vault". Write it straight:
  "Encrypted database", "Config file in plain YAML", "Signing key in a vault". The same goes
  for ", e.g." (use "such as").
- Colon reveals ("OpenID standard API: the PEP sends ..."), negation-led contrast
  ("X, not Y", "only", "never", "cannot" as a closer), parenthetical asides inside a label.
- "the X's own Y", "its own", "their own". Grep `\bown\b` before finishing.
- Symbols standing in for words in titles ("+", "&" in headings).

**Names**

- Straightforward, never thematic: blueprint, kit and handbook are out; okta-diagrams is in.
- Okta's natural names for Okta things, as Okta writes them: Okta Authorization Server,
  Universal Directory, Identity Threat Protection (ITP), Identity Governance.
- Check a term is accurate before using it. Prefer the term an architect at the customer
  would use.
- One name per thing across a page: a label on one line and not its twin is a defect.
- Okta's current product names, checked: Okta Device Access, not Desktop MFA.
- The precise class of thing, not an everyday stand-in: "Windows devices" or "the
  endpoint", not "the laptop".

**Diagram text**

- Sentence case everywhere. No spaced uppercase labels.
- Card title: a noun phrase naming the component. Card text: one or two lines, the
  component's job, led by a verb or by the component.
- Line labels: lower case, what moves along the line ("access token", "SSO, SCIM",
  "decision logs").
- Step panel: a one- or two-word title, then a plain sentence. Smaller and lighter than card
  text.
- Pills: one case for all (SCIM, IdP, AP1). ABAC terms (PDP, PEP, PIP, PAP) only in
  diagrams about ABAC, or when asked for; `STYLE.md`, "Pills", has the rule.
- Okta's policies are attribute-conditioned access policies, never "ABAC". The token inline
  hook adds claims and makes no access decision.

**Claims**

- Write for a competent setup on best practice: leave out caveats and how it is delivered.
  Sourcing notes ("documented only in community guides") go on a research page.
- Verify before stating; say what could not be verified. Check scope claims ("all groups and
  group rules included?") against Okta's documentation.

**In chat**

- Answer the question asked, in plain words. Name internal machinery by what it is
  ("the browser lock", not the name of the tool behind it).
- Be concise. State a default, proceed, and report.

**Spelling**

- British spelling in prose (organisation, behaviour, licence as a noun). Product and API
  names keep their published spelling (Authorization Server).

## Checklist

Before finishing any text:

1. Does each line say what a component does, in present tense, with the component leading?
2. Any fluff, explained reasoning, colon reveal, closing negation or aside? Cut it.
3. `grep -n '\bown\b'`.
4. Are product names Okta's names, and each term the one an architect would use?
5. Does the new text match the form of its neighbours?
6. Is every claim checked?
7. Read it aloud. Each line should sound like a solution architect explaining the picture
   to a customer: natural, streamlined, human-readable. No stacked noun phrases, no jargon
   a customer would not say (consumers, JML), no word repeated within a line.
8. One name per thing across the picture and its siblings: "applications" or "apps", not
   both; a card and the Okta section that serves it use the same name.
9. Step titles share one form (all verbs: Onboard, Link accounts, Provision), and line
   labels share one form (what moves; a port only where it is the exception).
10. Say the whole capability, not one case of it: provisioning creates, updates and
    disables; data comes in by pull or push, so say "takes in", not "sends".
