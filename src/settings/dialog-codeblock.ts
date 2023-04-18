import { Modal } from "obsidian"
import autoBind from "auto-bind"

import { CodeBlockSettings } from "./filesystem"
import { Dialog } from "./dialog"

export class CodeBlockSettingsDialog extends Modal {
  constructor(settings: CodeBlockSettings) {
    super(app)
    autoBind(this)

    this.containerEl.classList.add("mmng-settings-modal")
    Dialog("codeBlock", settings)(this.contentEl)
  }
}
