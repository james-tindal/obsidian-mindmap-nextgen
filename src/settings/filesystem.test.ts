import { defaultSettings, FilesystemManager, ScreenshotBgStyle, v2 } from './filesystem'

const loader = (data: any) => async () => data
const saver = (callback?: Function) =>
  async (data: any) =>
    { callback && callback(data) }

const defaults2_0 = {
  version: '2.0',
  layout: [],
  settings: defaultSettings
}


describe('Filesystem Settings Manager', () => {
  test('Use defaults for missing keys', async () => {
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
        screenshotTextColor: '#fdf6e3',
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
      expect(actual).toStrictEqual(expected)
    }

    const loadData = loader(input)
    const saveData = saver(testCb)
    await FilesystemManager(loadData, saveData)
  })

  test('Use defaults if no data', async () => {
    const testFn = (actual: any) =>
      expect(actual).toStrictEqual(defaults2_0)

    const loadData = loader(undefined)
    const saveData = saver(testFn)
    await FilesystemManager(loadData, saveData)
  })
})
