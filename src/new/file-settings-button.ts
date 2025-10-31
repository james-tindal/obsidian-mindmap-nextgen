import Callbag from 'src/utilities/callbag'
import { newActiveMarkdownView$ } from './active-markdown-view'
import { FileSettingsDialog } from 'src/settings/dialogs'
import { strings } from 'src/translation'


Callbag.subscribe(newActiveMarkdownView$, view =>
  view.addAction('dot-network', strings.fileSettingsButton,
    () => new FileSettingsDialog(view.editor).open()))
