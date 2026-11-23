# Diagram brief

Fill in what you know; the agent takes sensible defaults for the rest and says which.
Paste it after "Draw this with okta-diagrams:".

```text
Point:       <the one sentence the diagram proves>
Audience:    <architects / executives / engineers / customer>
Destination: <slide (16:9) / document / both>        theme: <blue / gradient>

Components (Okta is one node; consolidate the rest):
- <name>: <what it does, in one plain sentence>  [pill: a short label, if the concept needs one]  [tag: AP1]
- ...

Okta card sections (optional):
- <product, e.g. Authorization servers>: <rows>

Flows (kind = req | cfg | attr | log | warn | plain):
- <from> -> <to>: <label>  [kind]  [step n]
- ...

Steps for the side panel:
1. <title>: <one short line>
2. ...

Highlights (optional): <pattern name> lights <cards and flows>

Leave out: <anything the audience does not need>
```

## Example

```text
Point:       Okta issues the token; the API checks scope and claims on every call.
Audience:    application architects
Destination: slide, theme blue

Components:
- Users and agents: sign in from a browser or an agent runtime
- Okta: sign-in policies; a custom authorization server  [role: IdP]
- Web app or agent: redirects to Okta and calls the API
- Orders API: validates the token, then checks scope and claims
- Orders database: returns the orders the request may read

Flows:
- Users -> Okta: sign in [req] [step 1]
- Okta -> app: access token [req] [step 2]
- app -> API: API call with the token [req] [step 3]
- API -> database: query [req] [step 4]
```

That brief is `examples/token-flow.json`.
