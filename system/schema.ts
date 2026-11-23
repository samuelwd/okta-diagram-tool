// The diagram spec, defined once with zod: it validates specs (clear errors naming the
// field), gives the TypeScript types, and generates spec.schema.json for editor
// autocomplete in JSON specs (bun run schema).
//
// Coordinates are SVG viewBox units; at export, 1 unit = 1 px.
import { z } from "zod";
import { DEFAULT_TOKENS } from "./tokens/layout";

export const THEMES = ["blue", "gradient", "light"] as const;
export const Theme = z
  .enum(THEMES)
  .describe("blue (default), gradient, or light (white with a periwinkle glow)");

export const Kind = z
  .enum(["req", "cfg", "attr", "log", "warn", "plain"])
  .describe(
    "Line kind, one meaning everywhere: req request path, cfg configuration, attr attributes, log logs, warn missing or at risk, plain anything else",
  );

export const Point = z
  .union([
    z.tuple([z.number(), z.number()]),
    z
      .string()
      .regex(
        /^[\w-]+\.(top|bottom|left|right)(@-?[\d.]+%?)?$/,
        'use "card.side" or "card.side@offset" (px or %)',
      ),
  ])
  .describe('[x, y], or an anchor on a card edge: "card.side" or "card.side@offset"');

export const Flow = z
  .union([z.string(), z.array(z.string())])
  .describe('Highlight flow(s) this element belongs to; "all" stays lit in every flow');

export const TokenOverrides = z
  .object(
    Object.fromEntries(Object.keys(DEFAULT_TOKENS).map((k) => [k, z.number().optional()])) as Record<
      keyof typeof DEFAULT_TOKENS,
      z.ZodOptional<z.ZodNumber>
    >,
  )
  .strict()
  .describe("Layout values to override (system/tokens/layout.ts)");

const Lines = z.union([z.string(), z.array(z.string())]);

export const Zone = z
  .object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
    label: z.string(),
    at: z
      .enum(["tl", "tr", "bl", "br", "above"])
      .optional()
      .describe('label corner, default "tl"; "above" puts it over the zone as a stage label'),
    style: z
      .enum(["outline", "solid", "none"])
      .optional()
      .describe("outline (default), solid (a filled panel that cards sit on), none (the label only)"),
    labelX: z.number().optional().describe("label inset from its side"),
    flow: Flow.optional(),
  })
  .strict();

export const Section = z
  .object({
    icon: z.string().optional(),
    heading: z.string(),
    items: z.array(
      z.union([z.string(), z.object({ text: z.string(), role: z.string().optional() }).strict()]),
    ),
  })
  .strict();

export const Box = z
  .object({
    id: z.string().regex(/^[\w-]+$/, "letters, digits, - and _ only"),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number().optional().describe("default: fits the content"),
    title: Lines.optional().describe("one line; an array for two (titles never wrap by themselves)"),
    text: Lines.optional().describe("a string wraps to the card; an array is one line per item"),
    icon: z.string().optional().describe("an icon name (bun run icons list)"),
    iconSize: z.number().optional(),
    iconAt: z.enum(["tr", "br"]).optional(),
    logo: z.string().optional().describe('a wordmark drawn top-left, e.g. "okta-wordmark"'),
    marks: z
      .array(z.string())
      .optional()
      .describe(
        "a row of small marks under the title, e.g. the seals of the organisations a card stands for; the text moves down to make room",
      ),
    badges: z
      .array(z.string())
      .optional()
      .describe(
        'more marks in the top-right corner, left of the icon, e.g. ["okta-aura", "/", "shield-check"] for "Okta or another identity provider"; "/" draws a thin divider',
      ),
    hub: z.boolean().optional(),
    dashed: z.boolean().optional().describe("a dashed note card"),
    role: z.string().optional().describe('a chip on the top edge, e.g. "PEP"'),
    tag: z.string().optional().describe('a solid tag top-right, e.g. "AP1"'),
    items: z.array(z.object({ icon: z.string().optional(), text: z.string() }).strict()).optional(),
    sections: z.array(Section).optional(),
    note: z.string().optional(),
    flow: Flow.optional(),
    hl: z.string().optional().describe("hovering this card lights this flow"),
    variant: z
      .enum(["card", "open", "band"])
      .optional()
      .describe(
        "card (default); open: a large icon, title and text with no card around them; band: a rounded strip with an icon, a bold title and text on one line",
      ),
    bullets: z.boolean().optional().describe("put a bullet before each text line"),
    align: z.enum(["left", "center"]).optional().describe("title alignment (default left)"),
    pills: z
      .array(
        z
          .object({
            text: z.string(),
            tone: z.enum(["accent", "allow", "caution", "deny", "neutral", "violet"]).optional(),
          })
          .strict(),
      )
      .optional()
      .describe("a grid of pills under the title; tone colours a pill by meaning (default accent)"),
    pillCols: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe("pills per row (default 2); a short last row is centred"),
    inverse: z
      .boolean()
      .optional()
      .describe("text and icon in the solid panel's text colour (for an open card on a solid zone)"),
    tokens: TokenOverrides.optional(),
  })
  .strict();

export const Label = z
  .object({
    text: Lines,
    at: z.tuple([z.number(), z.number()]).optional().describe("default: beside the longest leg"),
    anchor: z.enum(["start", "middle", "end"]).optional(),
  })
  .strict();

export const Step = z
  .object({
    n: z.union([z.number(), z.string()]),
    at: z
      .union([z.tuple([z.number(), z.number()]), z.number().min(0).max(1)])
      .optional()
      .describe("a point, or a fraction along the line"),
    kind: Kind.optional(),
  })
  .strict();

export const Arrow = z
  .object({
    kind: Kind,
    points: z.array(Point).min(2),
    elbow: z.enum(["hv", "vh"]).optional(),
    curve: z
      .union([z.literal(true), z.number().gt(0).max(1)])
      .optional()
      .describe(
        "draw a smooth curve instead of elbows; waypoints shape it. A number sets how far the curve holds its direction at each point (default tokens.curveReach, 0.4)",
      ),
    head: z.enum(["end", "both", "none"]).optional(),
    dashed: z.boolean().optional(),
    inverse: z
      .boolean()
      .optional()
      .describe("draw the line in the solid panel's text colour (a line inside a solid zone)"),
    label: Label.optional(),
    steps: z.array(Step).optional(),
    flow: Flow.optional(),
  })
  .strict();

export const Mark = z
  .object({
    n: z.union([z.number(), z.string()]),
    at: z.tuple([z.number(), z.number()]),
    kind: Kind.optional(),
    flow: Flow.optional(),
  })
  .strict();

export const Raw = z
  .object({ svg: z.string(), layer: z.enum(["under", "over"]).optional(), flow: Flow.optional() })
  .strict()
  .describe("hand-written SVG, using the theme's classes");

export const SideStep = z
  .object({
    title: z.string(),
    text: Lines,
    n: z.union([z.number(), z.string()]).optional(),
    kind: Kind.optional(),
    flow: Flow.optional(),
  })
  .strict();

export const Sidebar = z
  .object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number().optional().describe("default: fits the steps"),
    title: z.string().optional(),
    steps: z.array(SideStep),
    groups: z
      .array(
        z
          .object({
            label: z.string(),
            from: z
              .number()
              .int()
              .min(0)
              .describe("index of the group's first step in steps, counting from 0"),
            to: z.number().int().min(0).describe("index of its last step, counting from 0"),
            flow: Flow.optional(),
          })
          .strict(),
      )
      .optional(),
    flow: Flow.optional(),
  })
  .strict();

const KeyEntry = z.enum([
  "req",
  "cfg",
  "attr",
  "log",
  "warn",
  "plain",
  "dashed",
  "step",
  "stepAttr",
  "stepCfg",
  "role",
  "tag",
]);
export const Legend = z
  .object({
    x: z.number().optional(),
    y: z.number().optional(),
    title: z.string().optional(),
    layout: z.enum(["column", "row"]).optional(),
    labels: z.partialRecord(KeyEntry, z.string()).optional(),
    hide: z.array(KeyEntry).optional(),
    note: z
      .string()
      .optional()
      .describe('a line under the key, e.g. "Connections use HTTPS 443 unless marked"'),
  })
  .strict();

export const FreeText = z
  .object({
    x: z.number(),
    y: z.number(),
    text: Lines,
    cls: z.string().optional(),
    anchor: z.enum(["start", "middle", "end"]).optional(),
    flow: Flow.optional(),
  })
  .strict();

export const Spec = z
  .object({
    $schema: z.string().optional(),
    title: z.string().describe("<title>, and the canvas heading unless heading is set"),
    description: z.string().describe("the diagram as one paragraph of prose (the SVG's aria-label)"),
    theme: Theme.optional(),
    canvas: z
      .object({ x: z.number().optional(), y: z.number().optional(), w: z.number(), h: z.number() })
      .strict(),
    heading: z.union([z.string(), z.literal(false)]).optional(),
    brand: z.boolean().optional().describe("the Okta wordmark top-left (default true)"),
    page: z
      .object({
        eyebrow: z.string().optional(),
        heading: z.string().optional(),
        lede: z.string().optional(),
        caption: z.string().optional(),
        hint: z.string().optional(),
      })
      .strict()
      .optional(),
    zones: z.array(Zone).optional(),
    panels: z
      .array(
        z
          .object({ x: z.number(), y: z.number(), w: z.number(), h: z.number(), flow: Flow.optional() })
          .strict(),
      )
      .optional(),
    boxes: z.array(Box).optional(),
    arrows: z.array(Arrow).optional(),
    texts: z.array(FreeText).optional(),
    marks: z.array(Mark).optional(),
    raw: z.array(Raw).optional(),
    sidebar: Sidebar.optional(),
    legend: z.union([Legend, z.literal(false)]).optional(),
    tokens: TokenOverrides.optional(),
  })
  .strict()
  .superRefine((s, ctx) => {
    // ids are unique, and every anchor names a card that exists
    const ids = new Set<string>();
    (s.boxes ?? []).forEach((b, i) => {
      if (ids.has(b.id))
        ctx.addIssue({
          code: "custom",
          path: ["boxes", i, "id"],
          message: `two cards have the id "${b.id}"`,
        });
      ids.add(b.id);
    });
    // side panel groups point at steps that exist (indexes count from 0)
    const nSteps = s.sidebar?.steps.length ?? 0;
    (s.sidebar?.groups ?? []).forEach((g, i) => {
      if (g.to >= nSteps || g.from > g.to)
        ctx.addIssue({
          code: "custom",
          path: ["sidebar", "groups", i],
          message: `group "${g.label}" spans steps ${g.from}-${g.to}, but steps are indexed 0-${nSteps - 1}`,
        });
    });
    (s.arrows ?? []).forEach((a, i) =>
      a.points.forEach((p, j) => {
        if (typeof p === "string" && !ids.has(p.split(".")[0]))
          ctx.addIssue({
            code: "custom",
            path: ["arrows", i, "points", j],
            message: `no card with the id "${p.split(".")[0]}"`,
          });
      }),
    );
  });

export type Theme = z.infer<typeof Theme>;
export type Kind = z.infer<typeof Kind>;
export type Point = z.infer<typeof Point>;
export type Flow = z.infer<typeof Flow>;
export type Zone = z.infer<typeof Zone>;
export type Section = z.infer<typeof Section>;
export type Box = z.infer<typeof Box>;
export type Label = z.infer<typeof Label>;
export type Step = z.infer<typeof Step>;
export type Arrow = z.infer<typeof Arrow>;
export type Mark = z.infer<typeof Mark>;
export type Raw = z.infer<typeof Raw>;
export type SideStep = z.infer<typeof SideStep>;
export type Sidebar = z.infer<typeof Sidebar>;
export type Legend = z.infer<typeof Legend>;
export type FreeText = z.infer<typeof FreeText>;
export type Spec = z.infer<typeof Spec>;
export type TokenOverrides = z.infer<typeof TokenOverrides>;

// Validate a spec; throws one readable error listing every problem with its path.
export function parseSpec(input: unknown, source = "spec"): Spec {
  const r = Spec.safeParse(input);
  if (r.success) return r.data;
  const lines = r.error.issues.map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`);
  throw new Error(`${source} is not a valid diagram spec:\n${lines.join("\n")}`);
}
