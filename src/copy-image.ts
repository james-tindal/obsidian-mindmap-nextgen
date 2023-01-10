import { Notice } from "obsidian";
import { Markmap } from "markmap-view";
import d3SvgToPng from "d3-svg-to-png";

import { ScreenshotBgStyle } from "./@types/screenshot";

interface ScreenshotSettings {
  backgroundColor: string
  textColor: string
}

interface ThemeColors {
  text: string,
  background: string
}

export async function takeScreenshot(
  pluginSettings: MindMapSettings,
  currentMm: Markmap,
  frontmatterOptions: FrontmatterOptions
) {
  const themeColors = getThemeColors(currentMm);
  const screenshotSettings = getScreenshotSettings(pluginSettings, frontmatterOptions, themeColors);
  prepareSvgDom(screenshotSettings, currentMm);
  const pngDataUrl: string = await createPng(screenshotSettings, currentMm);
  restoreSvgDom(themeColors, currentMm);
  copyImageToClipboard(pngDataUrl);
}

const getThemeColors = (currentMm: Markmap): ThemeColors => ({
  // Could probably get these colours without depending on currentMm
  text: currentMm.svg.style("color"),
  background: getComputedStyle(currentMm.svg.node().parentElement).backgroundColor
})

function getScreenshotSettings(
  pluginSettings: MindMapSettings,
  frontmatterOptions: FrontmatterOptions,
  themeColors: ThemeColors
): ScreenshotSettings {

  const pluginSettingsBGC = {
    [ScreenshotBgStyle.Transparent]: "transparent",
    [ScreenshotBgStyle.Color]: pluginSettings.screenshotBgColor,
    [ScreenshotBgStyle.Theme]: themeColors.background
  }[ pluginSettings.screenshotBgStyle ]

  const frontmatterBGC = frontmatterOptions?.screenshotBgColor

  const backgroundColor = frontmatterBGC || pluginSettingsBGC

  const textColor =
    frontmatterOptions?.screenshotTextColor ||
    pluginSettings.screenshotTextColorEnabled && pluginSettings.screenshotTextColor ||
    themeColors.text
  
  return { backgroundColor, textColor }
}

function prepareSvgDom({ textColor }: ScreenshotSettings, currentMm: Markmap) {
  setTextColor(textColor, currentMm)
}

function setTextColor(textColor: string, currentMm: Markmap) {
  const svg = currentMm.svg

  svg.style("color", textColor);

  svg
    .node()
    .querySelectorAll("div")
    .forEach((div) => {
      div.style.color = textColor;
    });
}

function createPng({ backgroundColor }: ScreenshotSettings, currentMm: Markmap) {
  return currentMm.fit().then(() => 
    d3SvgToPng("#markmap", "markmap.png", {
      scale: 3,
      format: "png",
      download: false,
      background: backgroundColor,
      quality: 1,
    }))
}

function restoreSvgDom(themeColors: ThemeColors, currentMm: Markmap) {
  setTextColor(themeColors.text, currentMm)
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