import { ExtraButtonComponent } from 'obsidian'
import { Component, div } from './various'
import { strings } from 'src/translation'


const Text = (text: string) => Component(document.createTextNode(text))
const Button = (icon: string) => Component(new ExtraButtonComponent(createFragment() as unknown as HTMLElement).setIcon(icon).extraSettingsEl)

const FileDoc = () =>
  div([
    Text(strings.settings.explanations.file[0] + ' '),
    Button('dot-network'),
    Text(' ' + strings.settings.explanations.file[1])
  ], 'mmng-settings-level-explanation')

const CodeBlockDoc = () =>
  div([
    Text(strings.settings.explanations.codeBlock[0] + ' '),
    Button('dot-network'),
    Text(' ' + strings.settings.explanations.codeBlock[1])
  ], 'mmng-settings-level-explanation')

export { FileDoc, CodeBlockDoc }
