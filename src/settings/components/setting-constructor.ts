import obsidian from 'obsidian'


export class Setting extends obsidian.Setting {
  addToggle(cb: (component: obsidian.ToggleComponent) => any): this {
    const toggle = new ToggleComponent(this.controlEl)
    this.components.push(toggle)
    cb(toggle)
    return this
  }
  addText(cb: (component: obsidian.TextComponent) => any): this {
    const textComponent = new TextComponent(this.controlEl)
    this.components.push(textComponent)
    cb(textComponent)
    return this
  }
  addDropdown(cb: (component: obsidian.DropdownComponent) => any): this {
    const dropdownComponent = new DropdownComponent(this.controlEl)
    this.components.push(dropdownComponent)
    cb(dropdownComponent)
    return this
  }
  addColorPicker(cb: (component: obsidian.ColorComponent) => any): this {
    const colorComponent = new ColorComponent(this.controlEl)
    this.components.push(colorComponent)
    cb(colorComponent)
    return this
  }
}

class ToggleComponent extends obsidian.ToggleComponent {
  onChange(callback: (value: boolean) => any): this {
    this.toggleEl.onclick = () =>
      callback(this.getValue())
    return this
  }
}

class TextComponent extends obsidian.TextComponent {
  onChange(callback: (value: string) => any): this {
    this.inputEl.oninput = () =>
      callback(this.inputEl.value)
    return this
  }
}

class DropdownComponent extends obsidian.DropdownComponent {
  onChange(callback: (value: string) => any): this {
    this.selectEl.onchange = () =>
      callback(this.selectEl.value)
    return this
  }
}

class ColorComponent extends obsidian.ColorComponent {
  onChange(callback: (value: string) => any): this {
    this.colorPickerEl.onchange = () =>
      callback(this.colorPickerEl.value)
    return this
  }
}
