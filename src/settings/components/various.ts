import { Setting } from "obsidian"


export type Component = { node: Node }
type HtmlComponent = Component & { node: HTMLElement }

export const Component = (node: Node): Component => ({ node })
export const HtmlComponent = (node: HTMLElement): HtmlComponent => ({ node })

type Children = Array<Component | false | undefined>

export const fragment = (children: Children) => Component(
  createFragment(fragment => children.forEach(child => child && fragment.append(child.node))))

export const div = (children: Children, options?: string | DomElementInfo) => HtmlComponent(
  createDiv(options, div => children.forEach(child => child && div.append(child.node))))

export const Heading = (title: string, desc?: string) => () =>
  HtmlComponent(new Setting(createFragment())
    .setHeading()
    .setName(title)
    .then(setting => desc && setting.setDesc(desc))
    .settingEl)
