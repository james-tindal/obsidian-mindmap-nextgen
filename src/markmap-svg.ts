import { Markmap } from "markmap-view"
import { range } from "ramda"

export function createSVG(
  containerEl: HTMLElement,
) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("markmap");

  const container = containerEl.children[1];
  container.appendChild(svg);

  const markmap = Markmap.create(svg, {})

  return { svg, markmap };
}
