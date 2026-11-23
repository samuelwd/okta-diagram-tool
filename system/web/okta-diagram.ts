// <okta-diagram>: a diagram in any HTML page.
//
//   <script type="module" src="okta-diagram.js"></script>
//   <okta-diagram src="examples/token-flow.json" theme="blue"></okta-diagram>
//   <okta-diagram theme="gradient"><script type="application/json">{ ...spec... }</script></okta-diagram>
//
// The spec comes from src (fetched) or an inline JSON script. It is validated, rendered, and
// drawn in a shadow root, so page styles and diagram styles never mix. Hovering a card lights
// its flow. Text is measured in the viewer's browser with the real font, so wrapping fits.
// Attributes: src, theme (blue | gradient), frame (none: no canvas shadow or corners).
import { attachHighlight } from "../components/highlight";
import { renderSvg } from "../components/diagram";
import { esc, setMeasurer } from "../components/text";
import { parseSpec, THEMES, type Theme } from "../schema";
import { fontUrls, stylesheet } from "../styles";

const fontSheets = new Map<string, Promise<void>>();

// Fonts load at document level; a shadow root uses them from there. Resolves once DM Sans is
// ready in the weights the diagram uses, so text is measured with the real font.
async function ensureFonts(theme: Theme): Promise<void> {
  await Promise.all(
    fontUrls(theme).map((url) => {
      let p = fontSheets.get(url);
      if (!p) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        p = new Promise<void>((ok) => {
          link.onload = () => ok();
          link.onerror = () => ok();
        });
        document.head.append(link);
        fontSheets.set(url, p);
      }
      return p;
    }),
  );
  await Promise.all([400, 500, 600].map((w) => document.fonts.load(`${w} 16px "DM Sans"`)));
}

// Measure text in this browser, with the loaded font: exact for the viewer's own rendering.
function browserMeasurer(root: ShadowRoot): (s: string, size: number, weight: number) => number {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("style", "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden");
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  svg.append(text);
  root.append(svg);
  return (s, size, weight) => {
    text.setAttribute("style", `font: ${weight} ${size}px "DM Sans", sans-serif; font-optical-sizing: none`);
    text.textContent = s;
    return text.getComputedTextLength();
  };
}

export class OktaDiagram extends HTMLElement {
  static observedAttributes = ["src", "theme", "frame"];
  #root = this.attachShadow({ mode: "open" });

  connectedCallback() {
    void this.#render();
  }
  attributeChangedCallback() {
    if (this.isConnected) void this.#render();
  }

  // Light the cards and lines of one flow (null for all), as hover does.
  setFlow(flow: string | null) {
    (this as any).__setFlow?.(flow);
  }

  async #spec(): Promise<unknown> {
    const src = this.getAttribute("src");
    if (src) {
      const r = await fetch(src);
      if (!r.ok) throw new Error(`${src}: ${r.status}`);
      return r.json();
    }
    const inline = this.querySelector('script[type="application/json"]');
    if (!inline?.textContent) throw new Error("give the diagram a src or an inline JSON script");
    return JSON.parse(inline.textContent);
  }

  async #render() {
    try {
      const spec = parseSpec(await this.#spec(), this.getAttribute("src") ?? "inline spec");
      const asked = this.getAttribute("theme") as Theme | null;
      const theme: Theme = asked && THEMES.includes(asked) ? asked : (spec.theme ?? "blue");
      await ensureFonts(theme);
      const frame =
        this.getAttribute("frame") === "none" ? ".scroll { border-radius: 0; box-shadow: none; }" : "";
      this.#root.innerHTML = "";
      setMeasurer(browserMeasurer(this.#root));
      let svg: string;
      try {
        svg = renderSvg(spec); // synchronous, so no other diagram measures in between
      } finally {
        setMeasurer(null);
      }
      this.#root.innerHTML =
        `<style>${stylesheet(theme).replace(/:root\b/g, ":host")}\n:host { display: block; }\n${frame}</style>` +
        `<div class="scroll">${svg}</div>`;
      attachHighlight(this.#root.querySelector("svg.wiring"), this);
    } catch (e) {
      this.#root.innerHTML = `<pre style="color:#b00020;white-space:pre-wrap;font:13px monospace">${esc(String((e as Error).message))}</pre>`;
    }
  }
}

if (!customElements.get("okta-diagram")) customElements.define("okta-diagram", OktaDiagram);
