export function createSVG(
  containerEl: HTMLElement,
): SVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add('markmap');

  const container = containerEl.children[1];
  container.appendChild(svg);

  return svg;
}

export function getComputedCss(el: HTMLElement) {
  const computed = getComputedStyle(el);
  const color = computed.getPropertyValue("--text-normal");
  const font = `1em ${computed.getPropertyValue("--default-font")}`;
  return { color, font };
}
