// Card: title, text, icon list, product sections, pills, note, corner icon, chip and tag.
// Variants: "card" (the default), "open" (a large icon, title and text with no card around
// them) and "band" (a rounded strip: icon, bold title and text on one line).
import { TYPE } from "../tokens/type";
import type { Box } from "../schema";
import { current, type Tokens } from "../tokens/layout";
import { chipW, role, tag } from "./chip";
import { inFlow } from "./flow";
import { icon } from "./icon";
import { esc, n, textWidth, wrap } from "./text";

// ---------- cards ----------

export type Laid = { box: Box; h: number; svg: string };

export function layBox(b: Box): Laid {
  const t: Tokens = { ...current.T, ...b.tokens };
  if (b.variant === "band") return layBand(b, t);
  const open = b.variant === "open";
  const right = b.x + b.w;
  const parts: string[] = [];
  const size = b.iconSize ?? t.iconSize;
  const iconRoom = !open && b.icon && (b.iconAt ?? "tr") === "tr" ? size + t.iconInset : 0;
  const padX = open ? 0 : t.padX;
  const center = b.align === "center";
  const tagRoom = b.tag
    ? Math.max(t.tagMinW, textWidth(b.tag, TYPE.tag.size, TYPE.tag.weight) + 16) + t.tagGap
    : 0;
  let base = b.y; // baseline of the last line drawn
  let pad = t.padBottom; // space under the last line

  if (open) {
    // the icon leads, large, above the title
    const s = b.iconSize ?? t.openIcon;
    if (b.icon) parts.push(icon(b.icon, center ? b.x + (b.w - s) / 2 : b.x, b.y, s));
    base = b.y + (b.icon ? s : 0) + t.openTitleGap - t.titleY;
  }
  if (b.logo) {
    parts.push(icon(b.logo, b.x + t.logoX, b.y + t.logoY, t.logoSize, "ic", false));
    base = b.y + t.titleY;
  }
  if (b.title) {
    // Titles never wrap: give an array for two lines.
    // The layout check reports a title that does not fit.
    const lines = Array.isArray(b.title) ? b.title : [b.title];
    const top = open ? base : b.y;
    lines.forEach((l, i) => {
      base = top + t.titleY + i * t.titleLine;
      const x = center ? b.x + b.w / 2 : b.x + padX;
      parts.push(
        `<text class="t" x="${n(x)}" y="${n(base)}"${center ? ` text-anchor="middle"` : ""}>${esc(l)}</text>`,
      );
    });
  }
  if (b.marks?.length && !open) {
    // a row of marks under the title (or at the top of an untitled card)
    const top = b.title || b.logo ? base + t.markTop : b.y + t.iconInset;
    b.marks.forEach((m, i) =>
      parts.push(icon(m, b.x + padX + i * (t.markSize + t.markGap), top, t.markSize)),
    );
    base = top + t.markSize + t.markText - (b.title ? t.textGap : 0);
  }
  const bulletRoom = b.bullets ? t.bulletTextX : 0;
  const wrapW = b.w - (open ? 0 : t.wrapRight) - bulletRoom - (b.title ? 0 : iconRoom + tagRoom);
  const text = wrap(b.text, wrapW, TYPE.cardText.size, TYPE.cardText.weight);
  const textGap = open ? t.openTextGap : t.textGap,
    textLine = open ? t.openTextLine : t.textLine;
  text.forEach((l, i) => {
    const openTop = b.y + (b.icon ? (b.iconSize ?? t.openIcon) : 0) + t.openTitleGap; // first line under an open card's icon
    base =
      i === 0
        ? b.title
          ? base + textGap
          : b.marks?.length && !open
            ? base
            : open
              ? openTop
              : b.logo
                ? b.y + t.logoTextY
                : b.y + t.textY
        : base + textLine;
    const x0 = b.x + padX;
    if (b.bullets)
      parts.push(`<circle class="bul" cx="${n(x0 + t.bulletX)}" cy="${n(base - 4.5)}" r="${t.bulletR}"/>`);
    if (center && !b.bullets)
      parts.push(
        `<text class="s" x="${n(b.x + b.w / 2)}" y="${n(base)}" text-anchor="middle">${esc(l)}</text>`,
      );
    else parts.push(`<text class="s" x="${n(x0 + bulletRoom)}" y="${n(base)}">${esc(l)}</text>`);
  });
  if (b.pills?.length) {
    // a grid of pills; a short last row is centred
    const cols = b.pillCols ?? 2;
    const inner = b.w - 2 * t.padX;
    const pw = (inner - (cols - 1) * t.pillGap) / cols;
    let top = base + t.pillFirst;
    b.pills.forEach((p, i) => {
      const r = Math.floor(i / cols),
        c = i % cols;
      const inRow = Math.min(cols, b.pills!.length - r * cols);
      const rowW = inRow * pw + (inRow - 1) * t.pillGap;
      const x = b.x + t.padX + (inner - rowW) / 2 + c * (pw + t.pillGap);
      const y = top + r * (t.pillH + t.pillGap);
      parts.push(
        `<g class="pill ${p.tone ?? "accent"}"><rect x="${n(x)}" y="${n(y)}" width="${n(pw)}" height="${t.pillH}" rx="5"/><text x="${n(x + pw / 2)}" y="${n(y + t.pillH / 2 + 4.2)}" text-anchor="middle">${esc(p.text)}</text></g>`,
      );
    });
    const rows = Math.ceil(b.pills.length / cols);
    base = top + rows * t.pillH + (rows - 1) * t.pillGap;
    pad = t.pillPadBottom;
  }
  (b.items ?? []).forEach((it, i) => {
    base += i === 0 ? t.itemFirst : t.itemGap;
    if (it.icon) parts.push(icon(it.icon, b.x + t.itemIconX, base - 13, t.itemIconSize));
    parts.push(
      `<text class="s" x="${n(b.x + (it.icon ? t.itemTextX : t.itemIconX))}" y="${n(base)}">${esc(it.text)}</text>`,
    );
    pad = t.itemPadBottom;
  });
  (b.sections ?? []).forEach((sec, si) => {
    base += si === 0 ? t.sectionFirst : t.sectionGap;
    if (sec.icon) parts.push(icon(sec.icon, b.x + t.sectionIconX, base - 13, 16, "oi"));
    parts.push(`<text class="gh" x="${n(b.x + t.sectionIndent)}" y="${n(base)}">${esc(sec.heading)}</text>`);
    sec.items.forEach((raw, ii) => {
      const it = typeof raw === "string" ? { text: raw } : raw;
      base += ii === 0 ? t.sectionItemFirst : t.sectionItemGap;
      parts.push(`<text class="s" x="${n(b.x + t.sectionIndent)}" y="${n(base)}">${esc(it.text)}</text>`);
      if (it.role) parts.push(role(it.role, right - t.chipRight - chipW(it.role, t), base - 13, t));
    });
    pad = t.sectionPadBottom;
  });
  if (b.note) {
    base += t.noteGap;
    parts.push(`<text class="gn" x="${n(b.x + t.padX)}" y="${n(base)}">${esc(b.note)}</text>`);
  }

  const h = b.h ?? (open ? Math.round(base - b.y + 8) : Math.max(t.minH, Math.round(base - b.y + pad)));
  if (b.icon && !open) {
    const at = b.iconAt ?? "tr";
    const ix = right - t.iconInset - size - (at === "tr" && b.tag ? tagRoom : 0);
    const iy = at === "tr" ? b.y + t.iconInset : b.y + h - t.iconInset - size;
    parts.push(icon(b.icon, ix, iy, size));
  }
  if (b.badges?.length && !open) {
    // right to left, from the card icon (or the corner when there is none)
    let x =
      right -
      t.iconInset -
      (b.tag ? tagRoom : 0) -
      (b.icon && (b.iconAt ?? "tr") === "tr" ? size + t.badgeGap : 0);
    const y = b.y + t.iconInset;
    for (const m of [...b.badges].reverse()) {
      if (m === "/") {
        x -= 10;
        parts.push(`<path class="badge-or" d="M${n(x + 8)} ${n(y + 1)} L${n(x + 2)} ${n(y + size - 1)}"/>`);
        x -= t.badgeGap;
      } else {
        x -= size;
        parts.push(icon(m, x, y, size));
        x -= t.badgeGap;
      }
    }
  }
  let svg = `<g class="${classes(b)}" data-id="${esc(b.id)}"><rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${n(h)}" rx="16"/>${parts.join("")}</g>`;
  if (b.role) svg += role(b.role, b.x + t.chipX, b.y - 9, t);
  if (b.tag) svg += tag(b.tag, right, b.y, t);
  return { box: b, h, svg: inFlow(svg, b.flow, b.hl) };
}

function classes(b: Box): string {
  return [
    "box",
    b.hub && "hub",
    b.dashed && "dashed",
    b.variant && b.variant !== "card" && b.variant,
    b.inverse && "inverse",
  ]
    .filter(Boolean)
    .join(" ");
}

// A band: a rounded strip with an icon, then a bold title and text on one line.
function layBand(b: Box, t: Tokens): Laid {
  const h = b.h ?? t.bandH;
  const s = b.iconSize ?? t.bandIcon;
  const parts: string[] = [];
  let x = b.x + t.bandPadX;
  if (b.icon) {
    parts.push(icon(b.icon, x, b.y + (h - s) / 2, s));
    x += s + 12;
  }
  const baseY = b.y + h / 2 + 5;
  const title = Array.isArray(b.title) ? b.title.join(" ") : b.title;
  if (title) {
    parts.push(`<text class="t" x="${n(x)}" y="${n(baseY)}">${esc(title)}</text>`);
    x += textWidth(title, TYPE.cardText.size, 600) + 10;
  }
  const text = Array.isArray(b.text) ? b.text.join(" ") : b.text;
  if (text) parts.push(`<text class="s" x="${n(x)}" y="${n(baseY)}">${esc(text)}</text>`);
  const svg = `<g class="${classes(b)}" data-id="${esc(b.id)}"><rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${n(h)}" rx="${n(h / 2)}"/>${parts.join("")}</g>`;
  return { box: b, h, svg: inFlow(svg, b.flow, b.hl) };
}

// The height a card takes once laid out (its h, or the height its content needs).
export function measure(b: Box): number {
  return layBox(b).h;
}
