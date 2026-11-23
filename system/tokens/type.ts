// Type scale: one family (DM Sans, standing in for Okta's licensed Aeonik), sentence case,
// no spaced uppercase. Sizes in px; a theme may change a weight (gradient uses 500 for
// card titles, zone labels and line labels). The renderer uses these sizes to wrap text.
export const FONT = {
  sans: '"DM Sans", "Helvetica Neue", sans-serif',
  mono: '"DM Mono", "Lucida Console", monospace',
};

export const TYPE = {
  heading: { size: 22, weight: 600, use: "Canvas heading, after the Okta wordmark" },
  cardTitle: { size: 16, weight: 600, use: "Card title" },
  cardText: { size: 13.5, weight: 400, use: "Card text, list items, section items" },
  openTitle: { size: 18, weight: 600, use: "Title of an open card (large icon, no card)" },
  stageLabel: { size: 13.5, weight: 600, use: "Stage label over a zone" },
  pill: { size: 12, weight: 400, use: "Pill in a card's pill grid" },
  sectionHeading: { size: 13, weight: 600, use: "Section heading inside a card (Okta products)" },
  zoneLabel: { size: 13, weight: 600, use: "Zone label" },
  lineLabel: { size: 12.5, weight: 600, use: "Line label" },
  panelTitle: { size: 15, weight: 600, use: "Side panel title and key title" },
  stepTitle: { size: 13.5, weight: 500, use: "Side panel step title" },
  stepText: { size: 12.5, weight: 400, use: "Side panel step text, free text" },
  groupLabel: { size: 12, weight: 500, use: "Step group label" },
  chip: { size: 10, weight: 500, use: "Pill on a card edge" },
  tag: { size: 11.5, weight: 600, use: "Pattern tag (AP1)" },
  stepNumber: { size: 13, weight: 800, use: "Number in a step circle" },
  key: { size: 11, weight: 400, use: "Key entry" },
} as const;
