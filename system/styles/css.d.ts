// Stylesheets imported as text (Bun: with { type: "text" }).
declare module "*.css" {
  const text: string;
  export default text;
}
