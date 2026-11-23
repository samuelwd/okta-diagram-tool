// okta-diagrams: the design system as a library. Pure functions, no file access, so it runs
// in Bun, Node or a browser.
//
//   import { renderSvg, renderHtml, parseSpec, stylesheet } from "okta-diagram-tool";
//   const svg = renderSvg(parseSpec(json));            // SVG markup using the theme classes
//   const css = stylesheet("blue");                    // the CSS that styles it
export { parseSpec, Spec as SpecSchema, THEMES } from "./schema";
export type * from "./schema";
export { renderSvg, markers } from "./components/diagram";
export { renderHtml, renderSlideHtml } from "./page";
export { stylesheet, baseCss, componentsCss, themeVars, fontUrls } from "./styles";
export { attachHighlight } from "./components/highlight";
// components, for building other diagram types on the same parts
export { layBox, measure } from "./components/card";
export { layArrow, stepSvg } from "./components/line";
export { laySidebar } from "./components/panel";
export { layLegend } from "./components/key";
export { role, tag, chipW } from "./components/chip";
export { icon, ICONS } from "./components/icon";
export { inFlow } from "./components/flow";
export { esc, textWidth, wrap, setMeasurer, estimate, type Measurer } from "./components/text";
// tokens
export { DEFAULT_TOKENS, type Tokens } from "./tokens/layout";
export { TYPE, FONT } from "./tokens/type";
export { KINDS, KEY_LABELS } from "./tokens/kinds";
export { PALETTE } from "./tokens/palette";
// layouts
export * from "./layouts/place";
