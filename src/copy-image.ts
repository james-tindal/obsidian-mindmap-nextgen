import { Notice } from "obsidian";
import { Markmap } from "markmap-view";
import d3SvgToPng from "d3-svg-to-png";

import { ScreenshotBgStyle } from "./@types/screenshot";

export function copyImageToClipboard(
  settings: MindMapSettings,
  currentMm: Markmap,
  frontmatterOptions: FrontmatterOptions
) {
  let background: string;
  switch (settings.screenshotBgStyle) {
    case ScreenshotBgStyle.Transparent:
      background = "transparent";
      break;
    case ScreenshotBgStyle.Color:
      background = settings.screenshotBgColor;
      break;
    case ScreenshotBgStyle.Theme:
      const computed = getComputedStyle(currentMm.svg.node().parentElement);

      background = computed.backgroundColor;
      break;
  }

  const screenshotFgColorSource = frontmatterOptions?.screenshotFgColor
    ? "frontmatter"
    : "settings";

  let oldForeground: string;
  if (
    settings.screenshotFgColorEnabled ||
    screenshotFgColorSource === "frontmatter"
  ) {
    oldForeground = setForeground(
      currentMm,
      frontmatterOptions?.screenshotFgColor || settings.screenshotFgColor
    );
  }
  currentMm.fit().then(() => {
    d3SvgToPng("#markmap", "markmap.png", {
      scale: 3,
      format: "png",
      download: false,
      background,
      quality: 1,
    }).then((output) => {
      if (
        settings.screenshotFgColorEnabled ||
        screenshotFgColorSource === "frontmatter"
      ) {
        setForeground(currentMm, oldForeground);
      }

      const blob = dataURItoBlob(output);

      navigator.clipboard
        .write([new ClipboardItem({ "image/png": blob })])
        .then(() => {
          new Notice("Image copied to clipboard");
        });
    });
  });
}

function setForeground(currentMm: Markmap, foreground: string) {
  const svg = currentMm.svg;

  let oldForeground = svg.style("color");
  svg
    .node()
    .querySelectorAll("div")
    .forEach((div) => {
      oldForeground = oldForeground || div.style.color;
    });

  svg.style("color", foreground);

  svg
    .node()
    .querySelectorAll("div")
    .forEach((div) => {
      div.style.color = foreground;
    });

  return oldForeground;
}

function dataURItoBlob(dataURI: string) {
  var byteString = atob(dataURI.split(",")[1]);

  var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

  var ab = new ArrayBuffer(byteString.length);

  var ia = new Uint8Array(ab);

  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  var blob = new Blob([ab], { type: mimeString });
  return blob;
}
