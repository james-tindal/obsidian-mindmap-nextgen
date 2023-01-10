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

  const screenshotTextColorSource = frontmatterOptions?.screenshotTextColor
    ? "frontmatter"
    : "settings";

  let oldTextColor: string;
  if (
    settings.screenshotTextColorEnabled ||
    screenshotTextColorSource === "frontmatter"
  ) {
    oldTextColor = setTextColor(
      currentMm,
      frontmatterOptions?.screenshotTextColor || settings.screenshotTextColor
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
        settings.screenshotTextColorEnabled ||
        screenshotTextColorSource === "frontmatter"
      ) {
        setTextColor(currentMm, oldTextColor);
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

function setTextColor(currentMm: Markmap, textColor: string) {
  const svg = currentMm.svg;

  let oldTextColor = svg.style("color");
  svg
    .node()
    .querySelectorAll("div")
    .forEach((div) => {
      oldTextColor = oldTextColor || div.style.color;
    });

  svg.style("color", textColor);

  svg
    .node()
    .querySelectorAll("div")
    .forEach((div) => {
      div.style.color = textColor;
    });

  return oldTextColor;
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
