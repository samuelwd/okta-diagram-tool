// The stylesheets as text, bundled with the code so the library reads no files at run time.
import base from "./base.css" with { type: "text" };
import components from "./components.css" with { type: "text" };
import blue from "../themes/blue.css" with { type: "text" };
import gradient from "../themes/gradient.css" with { type: "text" };
import light from "../themes/light.css" with { type: "text" };
import type { Theme } from "../schema";
import { TYPE } from "../tokens/type";

const THEME_CSS: Record<Theme, string> = { blue, gradient, light };
const IMPORT = /@import url\("([^"]+)"\);\n?/g;

export const baseCss = base;
export const componentsCss = components;

// A theme's variables, without its font @import (lifted into <link> tags by fontLinks).
export function themeVars(theme: Theme): string {
  return THEME_CSS[theme].replace(IMPORT, "");
}

// The font stylesheet URLs a theme needs.
export function fontUrls(theme: Theme): string[] {
  return [...THEME_CSS[theme].matchAll(IMPORT)].map((m) => m[1]);
}

// The type scale as CSS variables: --size-card-title: 16px, and so on.
export const typeVars = `:root, :host {\n${Object.entries(TYPE)
  .map(([k, v]) => `  --size-${k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}: ${v.size}px;`)
  .join("\n")}\n}`;

// Everything a page needs for one theme, in cascade order: sizes, structure, theme, components.
export function stylesheet(theme: Theme): string {
  return `${typeVars}\n${baseCss}\n${themeVars(theme)}\n${componentsCss}`;
}
