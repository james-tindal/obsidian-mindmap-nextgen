import { ValueComponent, ExtraButtonComponent, DropdownComponent, TextComponent, Setting } from 'obsidian'
import { globalSettings, GlobalSettings } from 'src/settings/filesystem'
import { Resolve } from 'src/workspace/utilities'


interface ControlComponent<T> extends ValueComponent<T> {
  onChange(callback: (value: T) => any): this
}

export const dropdown = (...options: [string, string][]) => ({ tag: 'dropdown' as const, options })
type dropdown = ReturnType<typeof dropdown>

export const text = (placeholder: string) => ({ tag: 'text' as const, options: { placeholder } })
type text = ReturnType<typeof text>

export const numberText = (placeholder: string) => ({ tag: 'numberText' as const, options: { placeholder } })
type numberText = ReturnType<typeof numberText>

type SettingOptions = {
  name: string,
  description?: string
  key: keyof GlobalSettings
  control: 'colorPicker' | 'toggle' | 'text' | text | 'numberText' | numberText | dropdown
}

export const SettingComponent = (options: SettingOptions) => {
  const common = () => {
    const setting = new Setting(createFragment())
      .setName(options.name)
    options.description && setting.setDesc(options.description)

    const controlType = typeof options.control === 'string' ? options.control : options.control.tag
    let control = Resolve<ControlComponent<any>>(resolve => ({
      text: () => setting.addText(resolve),
      numberText: () => setting.addText(resolve),
      colorPicker: () => setting.addColorPicker(resolve),
      dropdown: () => setting.addDropdown(resolve),
      toggle: () => setting.addToggle(resolve),
    })[controlType]())

    if (controlType === 'numberText') {
      const oldControl = control
      const newControl: ControlComponent<number> = Object.create(control)
      newControl.onChange = (listener: (n: number) => any) => {
        oldControl.onChange((str: string) => listener(Number.parseInt(str)))
        return newControl
      }
      newControl.setValue = (value: number) => { oldControl.setValue(value.toString()); return newControl }
      control = newControl
    }

    type Listener<T extends string | number | boolean = string | number | boolean> = (value: T) => void
    let changeListener: Listener<any>
    const originalOnChange = control.onChange.bind(control)
    control.onChange = cb =>
      originalOnChange(value => {
        changeListener?.(value)
        cb(value)
      })
    function onChange<T extends string | number | boolean>(listener: Listener<T>) { changeListener = listener }
    const fireChangeEvent = () => changeListener?.(control.getValue())

    const result = { node: setting.settingEl, control, key: options.key, onChange, fireChangeEvent }
    if (typeof options.control !== 'object')
      return result

    // Control options:

    if (options.control.tag === 'dropdown')
      for (const [value, display] of Object.values(options.control.options))
        (control as DropdownComponent).addOption(value, display)

    if (['text', 'numberText'].includes(options.control.tag))
      (control as TextComponent).setPlaceholder((options.control.options as { placeholder: string }).placeholder)

    return result
  }

  const global = () => {
    const { node, control, key, onChange } = common()

    function update() { control.setValue(globalSettings[key])}
    update()

    control.onChange(value =>
      (globalSettings[key] as any) = value)

    return {
      node,
      onChange,
      update
    }
  }

  const heritable = (inheritSettings: GlobalSettings, partialSettings: Partial<GlobalSettings>) => {
    const { node, control, key, onChange, fireChangeEvent } = common()
    const { resetButton } = construct()

    function loadState() {
      const value = partialSettings[key] ?? inheritSettings[key]
      setInherit(!(key in partialSettings))
      control.setValue(value)
    }
    loadState()

    control.onChange(newValue => {
      (partialSettings[key] as any) = newValue
      setInherit(false)
    })

    resetButton.onClick(() => {
      delete partialSettings[key]
      control.setValue(inheritSettings[key])
      setInherit(true)
      fireChangeEvent()
    })

    return {
      node,
      onChange,
      update: loadState
    }

    function construct() {
      const buttonContainer = createDiv('setting-item-info mmng-reset')
      const viewActions = createDiv({ cls: 'view-actions', parent: buttonContainer })
      const resetButton = new ExtraButtonComponent(viewActions).setIcon('refresh-ccw')
      node.prepend(buttonContainer)
      return { resetButton }
    }

    function setInherit(yes: boolean) {
      if (yes) {
        node.addClass('mmng-faded')
        resetButton.extraSettingsEl.toggleVisibility(false)
      } else {
        node.removeClass('mmng-faded')
        resetButton.extraSettingsEl.toggleVisibility(true)
      }
    }
  }

  return { global, heritable }
}
