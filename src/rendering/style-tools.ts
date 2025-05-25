import { GlobalSettings, settingChanges } from 'src/settings/filesystem'
import { plugin } from 'src/core/entry'


export type Trigger = (next: () => void) => void
export const settingTriggers = new Proxy(<Record<keyof GlobalSettings, Trigger>>{}, {
  get: (_, key: keyof GlobalSettings) => settingChanges.listen(key)
})

export const globalStyle = (() => {
  const styleEl = document.head.createEl('style')

  return { add, registerStyleElement }
  function add(trigger_s: Trigger | Trigger[], getStyleText: () => string, after?: () => void) {
    const section = new Text(getStyleText())
    styleEl.append(section)
    const updateSection = () => {
      section.textContent = getStyleText()
      after?.()
    }
    Array.isArray(trigger_s)
      ? trigger_s.forEach(trigger => trigger(updateSection))
      : trigger_s(updateSection)
  }

  function registerStyleElement() {
    plugin.register(() => styleEl.remove())
  }
})()
