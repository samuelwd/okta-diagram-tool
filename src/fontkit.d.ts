// fontkit ships no types; the measurer uses openSync, getVariation, layout and the font's metrics.
declare module "fontkit" {
  export function openSync(path: string): any;
}
