import { defaults, FilesystemManager, ScreenshotBgStyle, v1_0, v1_1, v2 } from "./filesystem"

const loader = (data: any) => async () => data
const saver = (callback?: Function) =>
  async (data: any) =>
    { callback && callback(data) }

const defaults2_0 = {
  version: "2.0",
  layout: [],
  settings: defaults
}


describe("Filesystem Settings Manager", () => {
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

    const expected: v2 = {
      version: '2.0',
      layout: [],
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
        screenshotBgStyle: ScreenshotBgStyle.Color,
        titleAsRootNode: true,
        useThemeFont: false
      }
    }

    const testCb = (actual: any) => {
      expect(actual).toStrictEqual(expected);
    }

    const loadData = loader(input);
    const saveData = saver(testCb);
    await FilesystemManager(loadData, saveData);
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

    const expected: v2 = {
      version: '2.0',
      layout: [],
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
        screenshotBgStyle: ScreenshotBgStyle.Theme,
        titleAsRootNode: true,
        useThemeFont: false
      }
    }

    const testCb = (actual: any) => {
      expect(actual).toStrictEqual(expected);
    }

    const loadData = loader(input);
    const saveData = saver(testCb);
    await FilesystemManager(loadData, saveData);
  })

  test("Use defaults for missing keys", async () => {
    const input = {
      version: '2.0',
      settings: {
        defaultColor: 'wrew',
        nodeMinHeight: 30,
        lineHeight: '27',
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
        screenshotTextColorEnabled: true,
        colorFreezeLevel: 50,
        animationDuration: 9000,
        maxWidth: 99,
        highlight: false,
        screenshotBgColor: 'r6t7y',
        screenshotBgStyle: ScreenshotBgStyle.Theme,
      }
    }

    const expected: v2 = {
      version: '2.0',
      layout: [],
      settings: {
        defaultColor: 'wrew',
        splitDirection: 'horizontal',
        nodeMinHeight: 30,
        lineHeight: '27',
        spacingVertical: 5,
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
        screenshotTextColorEnabled: true,
        coloring: 'depth',
        colorFreezeLevel: 50,
        animationDuration: 9000,
        maxWidth: 99,
        highlight: false,
        screenshotBgColor: 'r6t7y',
        screenshotBgStyle: ScreenshotBgStyle.Theme,
        titleAsRootNode: true,
        useThemeFont: false
      }
    }

    const testCb = (actual: any) => {
      expect(actual).toStrictEqual(expected);
    }

    const loadData = loader(input);
    const saveData = saver(testCb);
    await FilesystemManager(loadData, saveData);
  })

  test("Use defaults if no data", async () => {
    const testFn = (actual: any) =>
      expect(actual).toStrictEqual(defaults2_0);

    const loadData = loader(undefined);
    const saveData = saver(testFn);
    await FilesystemManager(loadData, saveData);
  })
});
