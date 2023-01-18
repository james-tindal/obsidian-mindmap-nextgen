import { Coloring, defaults, FileSystemManager, ScreenshotBgStyle, v1_0, v1_1, v2_0 } from "./filesystem-data"


const loader = (data: any) => async () => data
const saver = (callback?: Function) =>
  async (data: any) =>
    { callback && callback(data) }

// Promise will resolve when the function is called.
function waitFor<T>(): [(data: any) => void, Promise<T>] {
  let resolve;
  const promise = new Promise<T>(res => resolve = res);

  return [resolve, promise];
}

const defaults2_0 = {
  version: "2.0",
  settings: defaults
}


describe("Filesystem Data Manager", () => {
  test("Upgrade v1.0 to v2.0", async () => {

    const input: v1_0 = {
      color1: "blarg",
      color1Thickness: "yad",
      color2: "opo",
      color2Thickness: "qwe",
      color3: "oi",
      color3Thickness: "asd",
      defaultColorThickness: "iuoi",
    
      defaultColor: "wrew",
    
      splitDirection: "vertical",
      nodeMinHeight: 30,
      lineHeight: "27",
      spacingVertical: 88,
      spacingHorizontal: 6,
      paddingX: 0,
      initialExpandLevel: 234,
      onlyUseDefaultColor: true
    }

    const expected: v2_0 = {
      version: '2.0',
      settings: {
        defaultColor: 'wrew',
        splitDirection: 'vertical',
        nodeMinHeight: 30,
        lineHeight: '27',
        spacingVertical: 88,
        spacingHorizontal: 6,
        paddingX: 0,
        initialExpandLevel: 234,
        depth1Color: 'blarg',
        depth1Thickness: 'yad',
        depth2Color: 'opo',
        depth2Thickness: 'qwe',
        depth3Color: 'oi',
        depth3Thickness: 'asd',
        defaultThickness: 'iuoi',
        screenshotTextColor: "#fdf6e3",
        screenshotTextColorEnabled: false,
        coloring: 'single',
        colorFreezeLevel: 0,
        animationDuration: 500,
        maxWidth: 0,
        highlight: true,
        screenshotBgColor: '#002b36',
        screenshotBgStyle: ScreenshotBgStyle.Transparent
      }
    }

    const testCb = (actual: any) => {
      expect(actual).toStrictEqual(expected);
    }

    const loadData = loader(input);
    const saveData = saver(testCb);
    await FileSystemManager(loadData, saveData);
  });

  test("Upgrade v1.1 to v2.0", async () => {

    const input: v1_1 = {
      color1: "blarg",
      color1Thickness: "yad",
      color2: "opo",
      color2Thickness: "qwe",
      color3: "oi",
      color3Thickness: "asd",
      defaultColorThickness: "iuoi",
    
      defaultColor: "wrew",
    
      splitDirection: "vertical",
      nodeMinHeight: 30,
      lineHeight: "27",
      spacingVertical: 88,
      spacingHorizontal: 6,
      paddingX: 0,
      initialExpandLevel: 234,
      onlyUseDefaultColor: true,
    
      coloring: "branch",
      colorFreezeLevel: 50,
      animationDuration: 9000,
      maxWidth: 99,
      highlight: false,
      screenshotBgColor: "r6t7y",
      screenshotBgStyle: ScreenshotBgStyle.Theme,
      screenshotTransparentBg: false,
      screenshotFgColor: "sdfsdaf",
      screenshotFgColorEnabled: true,
    }

    const expected: v2_0 = {
      version: '2.0',
      settings: {
        defaultColor: 'wrew',
        splitDirection: 'vertical',
        nodeMinHeight: 30,
        lineHeight: '27',
        spacingVertical: 88,
        spacingHorizontal: 6,
        paddingX: 0,
        initialExpandLevel: 234,
        depth1Color: 'blarg',
        depth1Thickness: 'yad',
        depth2Color: 'opo',
        depth2Thickness: 'qwe',
        depth3Color: 'oi',
        depth3Thickness: 'asd',
        defaultThickness: 'iuoi',
        screenshotTextColor: 'sdfsdaf',
        screenshotTextColorEnabled: true,
        coloring: 'single',
        colorFreezeLevel: 50,
        animationDuration: 9000,
        maxWidth: 99,
        highlight: false,
        screenshotBgColor: 'r6t7y',
        screenshotBgStyle: ScreenshotBgStyle.Theme
      }
    }

    const testCb = (actual: any) => {
      expect(actual).toStrictEqual(expected);
    }

    const loadData = loader(input);
    const saveData = saver(testCb);
    await FileSystemManager(loadData, saveData);
  })

  test("Use defaults", async () => {
    const testFn = (actual: any) =>
      expect(actual).toStrictEqual(defaults2_0);

    const loadData = loader(undefined);
    const saveData = saver(testFn);
    await FileSystemManager(loadData, saveData);
  })
});

// There is only one SettingsManager.
// The methods that are shared with SettingsGetter should be a class
// SettingsManager is a SettingsGetter with one additional method: set

describe("SettingsManager", () => {

  async function setup (saveCb: Function) {
    const loadData = loader(undefined);
    const saveData = saver(saveCb);
    const [settingsManager] = await FileSystemManager(loadData, saveData);
    return settingsManager;
  }

  test("Can get what you set. Saves to filesystem", async () => {
    const [resolve, wait] = waitFor();
    let first = true;
    function saveFn(data: any) {
      if (first)
        first = false
      else
        resolve(data)
    }

    const settingsManager = await setup(saveFn);

    settingsManager.set("maxWidth", 5000);
    const maxWidth = settingsManager.get("maxWidth");
    expect(maxWidth).toBe(5000);

    const savedData = await wait;

    const expected: v2_0 = {
      version: '2.0',
      settings: {
        ...defaults,
        maxWidth
      }
    }
    
    expect(savedData).toStrictEqual(expected);
  })
})
