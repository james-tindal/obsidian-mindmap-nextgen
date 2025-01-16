import { ExtraButtonComponent } from 'obsidian'
import { Component, div } from './various'


const Text = (text: string) => Component(document.createTextNode(text))
const Button = (icon: string) => Component(new ExtraButtonComponent(createFragment() as unknown as HTMLElement).setIcon(icon).extraSettingsEl)

const FileDoc = () =>
  div([
    Text('To adjust settings for an individual file, click the '),
    Button('dot-network'),
    Text(' button in the top-right corner of a Markdown or Mindmap tab.')
  ], 'mmng-settings-level-explanation')

const CodeBlockDoc = () =>
  div([
    Text('To modify settings for each code block, hover over it and click the '),
    Button('sliders-horizontal'),
    Text(' button that appears in the top-right corner.')
  ], 'mmng-settings-level-explanation')

export { FileDoc, CodeBlockDoc }
