// Side panel: numbered steps, step groups, track lines.
import { TYPE } from "../tokens/type";
import type { Spec } from "../schema";
import { current } from "../tokens/layout";
import { inFlow } from "./flow";
import { stepSvg } from "./line";
import { esc, n, wrap } from "./text";

// ---------- sidebar and legend ----------

export function laySidebar(spec: Spec): { svg: string; bottom: number } {
  const sb = spec.sidebar!;
  const cx = sb.x + current.T.stepX,
    tx = sb.x + current.T.stepTextX;
  let svg = "";
  if (sb.title)
    svg += inFlow(
      `<text class="gt" x="${n(sb.x + 34)}" y="${n(sb.y + current.T.sideTitleY)}">${esc(sb.title)}</text>`,
      sb.flow ?? "all",
    );
  const groups = sb.groups ?? [];
  const groupOf = (i: number) => groups.findIndex((g) => i >= g.from && i <= g.to);
  // Step text wraps to the panel, or to the group frame inside one.
  const lines = sb.steps.map((s, i) =>
    wrap(s.text, sb.w - (tx - sb.x) - (groupOf(i) >= 0 ? 30 : 16), TYPE.stepText.size, TYPE.stepText.weight),
  );
  // The last text baseline of a step sits at cy + 26 + 17 per extra line.
  const textEnd = (i: number) => 26 + (lines[i].length - 1) * 17;
  const cys: number[] = [];
  let cy = sb.y + current.T.firstStep;
  let bottom = cy;
  sb.steps.forEach((s, i) => {
    const g = groupOf(i);
    if (i > 0) {
      const startsGroup = g >= 0 && groups[g].from === i;
      const endsGroup = groupOf(i - 1) >= 0 && groups[groupOf(i - 1)].to === i - 1;
      // the same space under every step's text (stepSpace), at least stepGap between
      // circles; a group frame adds groupPad where it opens and where it closes
      cy +=
        Math.max(current.T.stepGap, textEnd(i - 1) + current.T.stepSpace) +
        (startsGroup ? current.T.groupPad : 0) +
        (endsGroup ? current.T.groupPad : 0);
    }
    cys.push(cy);
    bottom = cy;
  });
  // group frames and the track lines between consecutive steps in the same run
  groups.forEach((g) => {
    const top = cys[g.from] - current.T.groupInset,
      bot = cys[g.to] + Math.max(current.T.groupInset, textEnd(g.to) + 18);
    svg += inFlow(
      `<rect class="gbox" x="${n(sb.x + 18)}" y="${n(top)}" width="${n(sb.w - 36)}" height="${n(bot - top)}" rx="12"/><text class="gcond" x="${n(sb.x + 34)}" y="${n(top + 26)}">${esc(g.label)}</text>`,
      g.flow ?? sb.steps[g.from].flow,
    );
    bottom = Math.max(bottom, bot);
  });
  for (let i = 1; i < sb.steps.length; i++) {
    if (groupOf(i) !== groupOf(i - 1)) continue;
    svg += inFlow(
      `<path class="gtrack" d="M${n(cx)} ${n(cys[i - 1])} V${n(cys[i])}"/>`,
      sb.steps[i].flow ?? sb.flow ?? "all",
    );
  }
  sb.steps.forEach((s, i) => {
    const y = cys[i];
    const num = s.n ?? i + 1;
    // white unless the step sets a kind ("go back to all white for these")
    let t = stepSvg(num, cx, y, s.kind ?? "req");
    t += `<text class="gtitle" x="${n(tx)}" y="${n(y + 5)}">${esc(s.title)}</text>`;
    lines[i].forEach((l, li) => {
      t += `<text class="gtext" x="${n(tx)}" y="${n(y + 26 + li * 17)}">${esc(l)}</text>`;
    });
    svg += inFlow(t, s.flow ?? sb.flow ?? "all");
  });
  // the panel itself, drawn first: the given height, or one that fits the steps
  const last = sb.steps.length - 1;
  const contentBottom = Math.max(bottom, last >= 0 ? cys[last] + textEnd(last) : bottom);
  const h = sb.h ?? Math.round(contentBottom - sb.y + 32);
  svg =
    inFlow(
      `<rect class="sidepanel" x="${n(sb.x)}" y="${n(sb.y)}" width="${n(sb.w)}" height="${n(h)}" rx="12"/>`,
      sb.flow ?? "all",
    ) + svg;
  return { svg, bottom };
}
