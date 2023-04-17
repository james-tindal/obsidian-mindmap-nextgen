import { Notice } from "obsidian";
import { Markmap } from "markmap-view";
import d3SvgToPng from "d3-svg-to-png";
import { ZoomTransform } from "d3-zoom"

import { GlobalSettings, ScreenshotBgStyle } from "src/settings/filesystem";

export interface ScreenshotColors {
  background: string;
  text: string;
}

export async function takeScreenshot(
  globalSettings: GlobalSettings,
  markmap: Markmap,
  frontmatterColors: ScreenshotColors
) {
  const themeColors = getThemeColors(markmap);
  const screenshotSettings = getScreenshotSettings(globalSettings, frontmatterColors, themeColors);
  prepareSvgDom(screenshotSettings, markmap);
  const pngDataUrl: string = await createPng(screenshotSettings, markmap);
  restoreSvgDom(themeColors, markmap);
  copyImageToClipboard(pngDataUrl);
}

const getThemeColors = (markmap: Markmap): ScreenshotColors => ({
  text: markmap.svg.style("color"),
  background: getComputedStyle(markmap.svg.node()!.parentElement!).backgroundColor
});

function getScreenshotSettings(
  globalSettings: GlobalSettings,
  frontmatterColors: ScreenshotColors,
  themeColors: ScreenshotColors
): ScreenshotColors {

  const globalSettingsBGC = {
    [ScreenshotBgStyle.Transparent]: "transparent",
    [ScreenshotBgStyle.Color]: globalSettings.screenshotBgColor,
    [ScreenshotBgStyle.Theme]: themeColors.background
  }[ globalSettings.screenshotBgStyle ];

  const frontmatterBGC = frontmatterColors?.background;

  const background = frontmatterBGC || globalSettingsBGC;

  const text =
    frontmatterColors?.text ||
    globalSettings.screenshotTextColorEnabled && globalSettings.screenshotTextColor ||
    themeColors.text;

  return { background, text };
}

function prepareSvgDom({ text }: ScreenshotColors, markmap: Markmap) {
  setTextColor(text, markmap);
}

function setTextColor(textColor: string, markmap: Markmap) {
  const svg = markmap.svg;

  svg.style("color", textColor);

  svg
    .node()!
    .querySelectorAll("div")
    .forEach((div) => {
      div.style.color = textColor;
    });
}

function createPng({ background }: ScreenshotColors, markmap: Markmap) {
  const svg = markmap.svg.node()! as SVGSVGElement & { __zoom: ZoomTransform };
  
  return markmap.fit().then(() =>
    d3SvgToPng(svg, "markmap.png", {
      scale: 2 / svg.__zoom.k,
      format: "png",
      download: false,
      background,
      quality: 1,
    }));
}

function restoreSvgDom(themeColors: ScreenshotColors, markmap: Markmap) {
  setTextColor(themeColors.text, markmap);
}

function copyImageToClipboard(pngDataUrl: string) {
  const blob = dataURItoBlob(pngDataUrl);

  navigator.clipboard
    .write([new ClipboardItem({ "image/png": blob })])
    .then(() => {
      new Notice("Image copied to clipboard");
    });
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