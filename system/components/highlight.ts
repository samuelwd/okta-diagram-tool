// Highlight flows on hover: hovering or focusing a card with data-hl keeps only its flow lit.
// Used inline in rendered pages (as source text) and by the <okta-diagram> element.
export function attachHighlight(svg: SVGSVGElement | null, host: any): void {
  if (!svg) return;
  function set(f: string | null) {
    svg!.classList.toggle("hl", !!f);
    svg!.querySelectorAll("[data-flow]").forEach(function (e) {
      var fl = (e.getAttribute("data-flow") || "").split(" ");
      e.classList.toggle("on", !!f && (fl.indexOf(f) >= 0 || fl.indexOf("all") >= 0));
    });
  }
  host.__setFlow = set;
  host.__flows = Array.from(
    new Set(
      Array.from(svg.querySelectorAll("[data-hl]")).map(function (e) {
        return e.getAttribute("data-hl");
      }),
    ),
  );
  svg.querySelectorAll("[data-hl]").forEach(function (el) {
    var f = el.getAttribute("data-hl");
    el.addEventListener("mouseenter", function () {
      set(f);
    });
    el.addEventListener("mouseleave", function () {
      set(null);
    });
    el.addEventListener("focus", function () {
      set(f);
    });
    el.addEventListener("blur", function () {
      set(null);
    });
  });
}
