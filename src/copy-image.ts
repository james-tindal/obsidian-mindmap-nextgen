import { Notice } from "obsidian";
import { MindMapSettings } from "./settings";
import { Markmap } from "markmap-view";
import d3SvgToPng from "d3-svg-to-png";
import { ScreenshotBgStyle } from "./@types/screenshot";

export function copyImageToClipboard(
  settings: MindMapSettings,
  currentMm: Markmap
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

  currentMm.fit().then(() => {
    d3SvgToPng("#markmap", "markmap.png", {
      scale: 3,
      format: "png",
      download: false,
      background,
      quality: 1,
    }).then((output) => {
      const blob = dataURItoBlob(output);

      navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      new Notice("Image copied to clipboard");
    });
  });
}

function dataURItoBlob(dataURI: string) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURI.split(",")[1]);

  // separate out the mime component
  var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);

  // create a view into the buffer
  var ia = new Uint8Array(ab);

  // set the bytes of the buffer to the correct values
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  // write the ArrayBuffer to a blob, and you're done
  var blob = new Blob([ab], { type: mimeString });
  return blob;
}
