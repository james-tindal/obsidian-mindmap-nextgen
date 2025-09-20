import * as obsidian from 'obsidian'


export class Setting extends obsidian.Setting {
  addToggle(cb: (component: obsidian.ToggleComponent) => void): this {
    const toggle = new ToggleComponent(this.controlEl)
    this.components.push(toggle)
    cb(toggle)
    return this
  }
  addText(cb: (component: obsidian.TextComponent) => void): this {
    const textComponent = new TextComponent(this.controlEl)
    this.components.push(textComponent)
    cb(textComponent)
    return this
  }
  addDropdown<T extends string = string>(cb: (component: obsidian.DropdownComponent<T>) => void): this {
    const dropdownComponent = new DropdownComponent<T>(this.controlEl)
    this.components.push(dropdownComponent)
    cb(dropdownComponent)
    return this
  }
  addColorPicker(cb: (component: obsidian.ColorComponent) => void): this {
    const colorComponent = new ColorComponent(this.controlEl)
    this.components.push(colorComponent)
    cb(colorComponent)
    return this
  }
}

class ToggleComponent extends obsidian.ToggleComponent {
  onChange(callback: (value: boolean) => void): this {
    this.toggleEl.onclick = () =>
      callback(this.getValue())
    return this
  }
}

class TextComponent extends obsidian.TextComponent {
  onChange(callback: (value: string) => void): this {
    this.inputEl.oninput = () =>
      callback(this.inputEl.value)
    return this
  }
}

class DropdownComponent<T extends string = string> extends obsidian.DropdownComponent<T> {
  onChange(callback: (value: T) => void): this {
    this.selectEl.onchange = () =>
      callback(this.selectEl.value as T)
    return this
  }
}

class ColorComponent extends obsidian.ColorComponent {
  onChange(callback: (value: string) => void): this {
    this.colorPickerEl.onchange = () =>
      callback(this.colorPickerEl.value)
    return this
  }
}
