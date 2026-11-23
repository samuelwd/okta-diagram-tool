// Line kinds: each keeps one meaning in every diagram and every theme. A theme gives each
// kind its colour (--req, --cfg, ...); the key labels below are the defaults a spec can rename.
export const KINDS = {
  req: {
    meaning: "The request path: what a user, agent or service sends to get access",
    key: "Request path",
  },
  cfg: {
    meaning: "Configuration: policy, rules and settings that one component deploys to another",
    key: "Configuration",
  },
  attr: { meaning: "Attributes and identity data: profiles, claims, lifecycle events", key: "Attributes" },
  log: { meaning: "Logs and audit: decisions and events sent for record", key: "Logs" },
  warn: { meaning: "Missing, planned or at risk", key: "Missing or at risk" },
  plain: { meaning: "Anything else", key: "Other" },
} as const;

// Default labels for every entry the key can show.
export const KEY_LABELS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(KINDS).map(([k, v]) => [k, v.key])),
  step: "Step",
  stepAttr: "Attribute step",
  stepCfg: "Configuration step",
  dashed: "Outside Okta",
  role: "Role",
  tag: "Pattern",
};
