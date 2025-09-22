import Callbag from 'src/utilities/callbag'
import { newActiveMarkdownView$ } from './new-active-markdown-view-stream'
import { FileSettingsDialog } from 'src/settings/dialogs'


Callbag.subscribe(newActiveMarkdownView$, view =>
  view.addAction('dot-network', 'Edit mindmap settings',
    () => new FileSettingsDialog(view.editor).open()))
