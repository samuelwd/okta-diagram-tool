// Layout rules: what the audit checks in a real browser, where text has real metrics.
// Runs inside the page (page.evaluate), so it is self-contained: no imports, no closures.
// Coordinates are SVG user units.
export type Issue = { level: "error" | "warn"; what: string };

export function audit(): Issue[] {
  const svg = document.querySelector("svg.wiring") as SVGSVGElement;
  const vb = svg.viewBox.baseVal;
  const issues: Issue[] = [];
  type R = { x: number; y: number; w: number; h: number };
  const r = (b: DOMRect | SVGRect): R => ({ x: b.x, y: b.y, w: b.width, h: b.height });
  const overlap = (a: R, b: R, pad = 0) =>
    Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > pad &&
    Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > pad;
  const inside = (p: { x: number; y: number }, b: R, inset: number) =>
    p.x > b.x + inset && p.x < b.x + b.w - inset && p.y > b.y + inset && p.y < b.y + b.h - inset;
  const label = (t: Element) => `"${(t.textContent ?? "").slice(0, 50)}"`;
  // A text's box includes ascender and descender room; compare the glyph core.
  const core = (b: R): R => ({ x: b.x, y: b.y + b.h * 0.25, w: b.w, h: b.h * (1 - 0.25 - 0.17) });

  // a nested <svg> (an icon) reports getBBox in its own viewBox units: use its placement
  const svgBox = (e: SVGSVGElement): R => ({
    x: e.x.baseVal.value,
    y: e.y.baseVal.value,
    w: e.width.baseVal.value,
    h: e.height.baseVal.value,
  });
  const boxes = [...svg.querySelectorAll<SVGGElement>(".box, .frame")].map((g) => ({
    id: g.dataset.id ?? "?",
    g,
    r: r((g.querySelector(":scope > rect") as SVGRectElement).getBBox()),
  }));
  const texts = [...svg.querySelectorAll<SVGTextElement>("text")].filter((t) => (t.textContent ?? "").trim());

  // 1. text inside a card stays inside it
  for (const b of boxes)
    for (const t of b.g.querySelectorAll("text")) {
      const tb = r((t as SVGTextElement).getBBox());
      // name the edge it crosses, and by how much
      // an open card has no box to pad: its text may reach its bounds
      const px = b.g.classList.contains("open") ? -1 : 6,
        py = b.g.classList.contains("open") ? -1 : 2;
      const past = [
        ["left", b.r.x + px - tb.x],
        ["right", tb.x + tb.w - (b.r.x + b.r.w - px)],
        ["top", b.r.y + py - tb.y],
        ["bottom", tb.y + tb.h - (b.r.y + b.r.h - py)],
      ].filter(([, d]) => (d as number) > 0) as [string, number][];
      if (past.length)
        issues.push({
          level: "error",
          what: `text overflows card "${b.id}": ${label(t)} (${past.map(([e, d]) => `${Math.ceil(d)}px past the ${e} edge`).join(", ")})`,
        });
    }
  // 2. no two texts overlap
  const tbs = texts.map((t) => ({ t, b: core(r(t.getBBox())) }));
  for (let i = 0; i < tbs.length; i++)
    for (let j = i + 1; j < tbs.length; j++)
      if (overlap(tbs[i].b, tbs[j].b, 1.5))
        issues.push({ level: "error", what: `texts overlap: ${label(tbs[i].t)} and ${label(tbs[j].t)}` });
  // 2b. a key (the tool's or a hand-drawn <g class="legend">) keeps clear of other text and of cards
  for (const legend of svg.querySelectorAll<SVGGElement>(".legend")) {
    const lb = r(legend.getBBox());
    const pad = { x: lb.x - 6, y: lb.y - 6, w: lb.w + 12, h: lb.h + 12 };
    for (const t of texts) {
      if (t.closest(".legend")) continue;
      if (overlap(r(t.getBBox()), pad, 0))
        issues.push({ level: "error", what: `the key crowds text: ${label(t)}` });
    }
    for (const b of boxes)
      if (overlap(lb, b.r, 0)) issues.push({ level: "error", what: `the key sits on card "${b.id}"` });
  }
  // 2c. a card carries a few rows, not a catalogue (docs/STYLE.md, Layout)
  for (const b of boxes) {
    const rows = b.g.querySelectorAll("text.s").length;
    if (rows > 12)
      issues.push({
        level: "warn",
        what: `card "${b.id}" has ${rows} rows of text; a catalogue belongs in a table, not a diagram`,
      });
  }
  // 3. text clears the step circles
  const circles = [...svg.querySelectorAll<SVGCircleElement>(".step circle")].filter(
    (c) => !c.closest(".legend"),
  );
  for (const t of texts) {
    if (t.closest(".step, .legend")) continue;
    const tb = core(r(t.getBBox()));
    for (const c of circles)
      if (overlap(tb, r(c.getBBox()), 0.5))
        issues.push({
          level: "error",
          what: `text touches step ${c.parentElement?.textContent}: ${label(t)}`,
        });
  }
  // 4. card text clears the card's icons
  for (const b of boxes) {
    const icons = [...b.g.querySelectorAll(":scope > svg")].map((s) => ({
      x: Number(s.getAttribute("x")),
      y: Number(s.getAttribute("y")),
      w: Number(s.getAttribute("width")),
      h: Number(s.getAttribute("height")),
    }));
    for (const t of b.g.querySelectorAll("text"))
      for (const ic of icons)
        if (overlap(r((t as SVGTextElement).getBBox()), ic, 1))
          issues.push({ level: "error", what: `text runs into an icon in card "${b.id}": ${label(t)}` });
  }
  // 5. cards do not overlap
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++)
      if (overlap(boxes[i].r, boxes[j].r))
        issues.push({ level: "error", what: `cards overlap: "${boxes[i].id}" and "${boxes[j].id}"` });
  // 6. line labels and loose text stay off cards
  for (const t of texts) {
    if (t.closest(".box, .frame, .role, .ra, .legend, .step")) continue;
    const tb = r(t.getBBox());
    for (const b of boxes)
      if (overlap(tb, b.r, 1))
        issues.push({ level: "error", what: `text sits on card "${b.id}": ${label(t)}` });
  }
  // 7. lines do not run through cards
  for (const p of svg.querySelectorAll<SVGPathElement>("path.a, path.line")) {
    if (p.closest(".legend")) continue;
    const len = p.getTotalLength();
    const hit = new Set<string>();
    // an open card has no box: a line may cross its empty area, not its icon (text has its own check)
    const solid = boxes.filter((b) => !b.g.classList.contains("open") && !b.g.classList.contains("over"));
    const openIcons = boxes
      .filter((b) => b.g.classList.contains("open"))
      .flatMap((b) =>
        [...b.g.querySelectorAll<SVGSVGElement>(":scope > svg")].map((ic) => ({ id: b.id, r: svgBox(ic) })),
      );
    for (let d = 6; d < len - 6; d += 4) {
      const pt = p.getPointAtLength(d);
      for (const b of [...solid, ...openIcons]) if (inside(pt, b.r, 3)) hit.add(b.id);
    }
    for (const id of hit)
      issues.push({ level: "warn", what: `a line runs through card "${id}": ${p.getAttribute("d")}` });
  }
  // 7b. lines and arrowheads stay off text (step numbers sit on lines by design), key text
  // included; a key's sample arrows are checked against that key's own labels
  const textCores = texts
    .filter((t) => !t.closest(".step, .over"))
    .map((t) => ({ t, b: core(r(t.getBBox())) }));
  for (const p of svg.querySelectorAll<SVGPathElement>("path.a, path.line")) {
    const inKey = p.closest(".legend");
    const targets = inKey ? textCores.filter(({ t }) => t.closest(".legend") === inKey) : textCores;
    const len = p.getTotalLength();
    const hit = new Set<SVGTextElement>();
    for (let d = 0; d <= len; d += 3) {
      const pt = p.getPointAtLength(d);
      for (const { t, b } of targets) if (inside(pt, b, -1)) hit.add(t);
    }
    for (const t of hit)
      issues.push({
        level: "error",
        what: `${inKey ? "a key arrow" : t.closest(".legend") ? "a line runs through the key at" : "a line runs through text:"}${inKey ? " runs into" : ""} ${label(t)}`,
      });
  }
  // 7c. zones either nest or stay apart: a zone that overlaps another must contain it
  const zones = [...svg.querySelectorAll<SVGRectElement>(".zone > rect")].map((z) => ({
    r: r(z.getBBox()),
    name: z.parentElement?.textContent?.trim() ?? "?",
  }));
  const within = (a: R, b: R) =>
    a.x >= b.x - 1 && a.y >= b.y - 1 && a.x + a.w <= b.x + b.w + 1 && a.y + a.h <= b.y + b.h + 1;
  for (let i = 0; i < zones.length; i++)
    for (let j = i + 1; j < zones.length; j++)
      if (
        overlap(zones[i].r, zones[j].r) &&
        !within(zones[i].r, zones[j].r) &&
        !within(zones[j].r, zones[i].r)
      )
        issues.push({
          level: "error",
          what: `zones overlap without one containing the other: "${zones[i].name}" and "${zones[j].name}"`,
        });
  // 7d. an arrowhead lands on something: a card edge, a zone edge or another line
  // an open card's icon counts too, with room for the arrowhead gap
  const iconEdges = boxes
    .filter((b) => b.g.classList.contains("open"))
    .flatMap((b) =>
      [...b.g.querySelectorAll<SVGSVGElement>(":scope > svg")].map((ic) => {
        const q = svgBox(ic);
        return { x: q.x - 12, y: q.y - 12, w: q.w + 24, h: q.h + 24 };
      }),
    );
  // a hand-written slide's nodes (class "node": a circle or any shape) are targets too
  const nodeEdges = [...svg.querySelectorAll<SVGGraphicsElement>(".node")].map((e) => {
    const q = r(e.getBBox());
    return { x: q.x - 12, y: q.y - 12, w: q.w + 24, h: q.h + 24 };
  });
  const edges = [...boxes.map((b) => b.r), ...zones.map((z) => z.r), ...iconEdges, ...nodeEdges];
  const onEdge = (p: { x: number; y: number }, b: R) =>
    p.x >= b.x - 4 &&
    p.x <= b.x + b.w + 4 &&
    p.y >= b.y - 4 &&
    p.y <= b.y + b.h + 4 &&
    (Math.abs(p.x - b.x) <= 4 ||
      Math.abs(p.x - b.x - b.w) <= 4 ||
      Math.abs(p.y - b.y) <= 4 ||
      Math.abs(p.y - b.y - b.h) <= 4);
  for (const p of svg.querySelectorAll<SVGPathElement>("path.a, path.line")) {
    if (p.closest(".legend")) continue;
    const ends: { x: number; y: number }[] = [];
    if (p.getAttribute("marker-end")) ends.push(p.getPointAtLength(p.getTotalLength()));
    if (p.getAttribute("marker-start")) ends.push(p.getPointAtLength(0));
    for (const e of ends)
      if (!edges.some((b) => onEdge(e, b)))
        issues.push({
          level: "error",
          what: `an arrowhead ends in open space at (${Math.round(e.x)}, ${Math.round(e.y)}): ${p.getAttribute("d")}`,
        });
  }
  // 8. everything inside the canvas
  for (const el of [...texts, ...boxes.map((b) => b.g)]) {
    const b = r((el as SVGGraphicsElement).getBBox());
    if (b.x < vb.x || b.y < vb.y || b.x + b.w > vb.x + vb.width || b.y + b.h > vb.y + vb.height)
      issues.push({
        level: "error",
        what: `outside the canvas: ${el.tagName === "text" ? label(el) : `card "${(el as SVGGElement).dataset.id}"`}`,
      });
  }
  // 9. text that starts in the side panel or a step group stays inside it
  for (const frame of svg.querySelectorAll<SVGRectElement>("rect.sidepanel, rect.gbox")) {
    const fb = r(frame.getBBox());
    for (const t of texts) {
      if (t.closest(".legend")) continue;
      const tb = r(t.getBBox());
      if (inside({ x: tb.x, y: tb.y + tb.h / 2 }, fb, 0) && tb.x + tb.w > fb.x + fb.w - 8)
        issues.push({
          level: "error",
          what: `text runs out of the ${frame.classList.contains("gbox") ? "step group" : "side panel"}: ${label(t)}`,
        });
    }
  }
  return issues;
}
