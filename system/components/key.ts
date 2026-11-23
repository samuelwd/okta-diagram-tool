// Key: built from what the diagram uses, in a column or a row.
import { TYPE } from "../tokens/type";
import type { Spec } from "../schema";
import { KEY_LABELS } from "../tokens/kinds";
import { current } from "../tokens/layout";
import { esc, n, textWidth } from "./text";

export function layLegend(spec: Spec, sideBottom: number | null): string {
  if (spec.legend === false) return "";
  const lg = spec.legend ?? {};
  let x = lg.x ?? (spec.sidebar ? spec.sidebar.x + 34 : (spec.canvas.x ?? 0) + spec.canvas.w - 220);
  const y = lg.y ?? (sideBottom !== null ? sideBottom + 82 : (spec.canvas.y ?? 0) + 40);
  const arrows = spec.arrows ?? [];
  const used = new Set<string>(arrows.map((a) => a.kind));
  // step colours in use: on the lines, in marks and in the side panel
  const stepKinds = new Set<string>();
  for (const a of arrows) for (const st of a.steps ?? []) stepKinds.add(st.kind ?? a.kind);
  for (const m of spec.marks ?? []) stepKinds.add(m.kind ?? "req");
  for (const st of spec.sidebar?.steps ?? []) if (st.kind) stepKinds.add(st.kind);
  const tint = (k: string) => (k === "attr" ? "stepAttr" : k === "cfg" ? "stepCfg" : "step");
  if (stepKinds.size || spec.sidebar) for (const k of stepKinds.size ? stepKinds : ["req"]) used.add(tint(k));
  if (arrows.some((a) => a.dashed)) used.add("dashed");
  const boxes = spec.boxes ?? [];
  if (
    boxes.some((b) => b.role || b.sections?.some((s) => s.items.some((i) => typeof i !== "string" && i.role)))
  )
    used.add("role");
  if (boxes.some((b) => b.tag)) used.add("tag");
  // The sample pill shows the diagram's own first label when it fits, else none.
  const pills = boxes.flatMap((b) => [
    b.role,
    ...(b.sections ?? []).flatMap((s) => s.items.map((i) => (typeof i === "string" ? undefined : i.role))),
  ]);
  // The sample pill shows the diagram's own first label, and widens to fit it.
  const pillLabel = pills.find(Boolean) ?? "";
  const pillW = Math.max(28, Math.ceil(textWidth(pillLabel, 8.5, 600)) + 12);
  const tagLabel = boxes.find((b) => b.tag)?.tag ?? "";
  const tagW = Math.max(30, Math.ceil(textWidth(tagLabel, 8.5, 600)) + 12);
  const order = [
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
  ].filter((k) => used.has(k) && !(lg.hide ?? []).includes(k as never));
  let svg = `<text class="gt" x="${n(x)}" y="${n(y)}">${esc(lg.title ?? "Key")}</text>`;
  const row = lg.layout === "row";
  let rx = x + (row ? textWidth(lg.title ?? "Key", TYPE.panelTitle.size, TYPE.panelTitle.weight) + 28 : 0);
  order.forEach((k, i) => {
    const ty = row ? y : y + current.T.legendFirst + i * current.T.legendRow;
    const x0 = x;
    // in a row each entry starts where the last one ended
    if (row) x = rx;
    const label = esc((lg.labels as Record<string, string> | undefined)?.[k] ?? KEY_LABELS[k]);
    if (k === "step" || k === "stepAttr" || k === "stepCfg") {
      const c = k === "stepAttr" ? " attr" : k === "stepCfg" ? " cfg" : "";
      svg += `<g class="step${c}"><circle cx="${n(x + 11)}" cy="${n(ty - 4)}" r="7"/><text class="ks" x="${n(x + 11)}" y="${n(ty - 0.5)}" text-anchor="middle">1</text></g>`;
    } else if (k === "dashed") {
      // in the colour of the dashed lines the diagram draws
      const dk = arrows.find((ar) => ar.dashed)?.kind ?? "plain";
      svg += `<path class="a${dk === "plain" ? "" : " " + dk} opt" d="M${n(x)} ${n(ty - 4)} H${n(x + 22)}" marker-end="url(#ah-${dk})"/>`;
    } else if (k === "role")
      svg += `<g class="role"><rect x="${n(x - 3)}" y="${n(ty - 11)}" width="${pillW}" height="14" rx="7"/><text class="kc" x="${n(x - 3 + pillW / 2)}" y="${n(ty - 1)}" text-anchor="middle">${esc(pillLabel)}</text></g>`;
    else if (k === "tag")
      svg += `<g class="ra"><rect x="${n(x - 4)}" y="${n(ty - 11)}" width="${tagW}" height="14" rx="7"/><text class="kc" x="${n(x - 4 + tagW / 2)}" y="${n(ty - 1)}" text-anchor="middle">${esc(tagLabel)}</text></g>`;
    else
      svg += `<path class="a${k === "plain" ? "" : " " + k}" d="M${n(x)} ${n(ty - 4)} H${n(x + 22)}" marker-end="url(#ah-${k})"/>`;
    // a wide sample pill pushes its label right
    const extra = k === "role" ? pillW - 28 : k === "tag" ? tagW - 30 : 0;
    svg += `<text class="key" x="${n(x + current.T.legendTextX + extra)}" y="${n(ty)}">${label}</text>`;
    if (row) {
      rx = x + current.T.legendTextX + extra + textWidth(label, TYPE.key.size, TYPE.key.weight) + 28;
      x = x0;
    }
  });
  // a note under the last entry (a column), or after the last entry (a row)
  if (lg.note) {
    const ny = row
      ? y + current.T.legendRow
      : y + current.T.legendFirst + order.length * current.T.legendRow + 6;
    svg += `<text class="key" x="${n(x)}" y="${n(ny)}">${esc(lg.note)}</text>`;
  }
  return `<g class="legend">${svg}</g>`;
}
