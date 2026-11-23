// Layout tokens: every spacing the renderer uses, in viewBox units.
// A spec overrides any of them for the whole diagram (spec.tokens), a card for itself
// (box.tokens). The defaults reproduce the first hand-drawn diagrams in this style.
export const DEFAULT_TOKENS = {
  // cards
  padX: 16, // text inset from the card's left edge
  titleY: 30, // first title baseline below the card's top
  titleLine: 20, // between title lines
  textGap: 24, // title baseline to the first text line
  textY: 30, // first text baseline when there is no title
  textLine: 20, // between text lines
  wrapRight: 26, // card width minus this is the wrap width (with padX on the left)
  padBottom: 18, // under the last text line
  minH: 80,
  iconSize: 20,
  iconInset: 12, // corner icon inset from the card edges
  logoSize: 26,
  logoX: 18,
  logoY: 17,
  logoTextY: 66, // first text baseline under a logo
  // icon lists (items)
  itemFirst: 33,
  itemGap: 30,
  itemIconX: 18,
  itemTextX: 44,
  itemIconSize: 16,
  itemPadBottom: 35,
  // product sections
  sectionFirst: 42,
  sectionGap: 36,
  sectionItemFirst: 25,
  sectionItemGap: 23,
  sectionIndent: 42,
  sectionIconX: 18,
  sectionPadBottom: 33,
  noteGap: 22,
  // bullets
  bulletX: 5,
  bulletTextX: 18,
  bulletR: 2.4,
  // open cards (variant "open")
  openIcon: 56,
  openTitleGap: 34,
  openTextGap: 26,
  openTextLine: 23,
  // pills
  pillH: 23,
  pillGap: 6,
  pillFirst: 14,
  pillPadBottom: 14,
  markSize: 22,
  markGap: 4,
  markTop: 10,
  markText: 20, // a row of marks under the title: size, gap, title baseline to the row, row to the first text baseline
  badgeGap: 8, // between corner badges (and the card icon)
  // bands (variant "band")
  bandH: 36,
  bandIcon: 20,
  bandPadX: 18,
  // chips and tags
  chipX: 14, // pill inset from the card's left edge
  chipPad: 12, // pill width beyond its text
  chipMinW: 32, // pill width floor (three-letter labels all come out at this width)
  chipRight: 8, // section pills from the card's right edge
  tagMinW: 40,
  tagGap: 10, // tag width floor; gap between a tag and the icon
  // zones
  zoneLabelX: 20,
  zoneLabelY: 26,
  zoneLabelBottom: 12,
  zoneLabelRight: 18,
  stageLabelGap: 12, // a label "above" a zone sits this far over its top edge
  // lines
  arrowGap: 2, // between an arrowhead and the card edge
  labelOffset: 8,
  labelLine: 16,
  curveReach: 0.4, // a curve's handle length, as a fraction of the distance between its two points
  curveSamples: 32, // points per curve piece when measuring it (steps, labels)
  // side panel
  sideTitleY: 24,
  firstStep: 63,
  stepGap: 0, // the least distance between two steps' circles (92 gives a fixed rhythm)
  stepSpace: 34, // space under a step's last text line before the next step, so gaps look even
  groupPad: 38,
  groupInset: 61,
  stepX: 45,
  stepTextX: 64,
  // key
  legendFirst: 36,
  legendRow: 24,
  legendTextX: 36,
  // heading
  headingX: 150, // with the wordmark; 40 without
  headingY: 40,
};
export type Tokens = typeof DEFAULT_TOKENS;

// The values in force while a diagram renders: the defaults plus spec.tokens.
export const current: { T: Tokens } = { T: { ...DEFAULT_TOKENS } };
