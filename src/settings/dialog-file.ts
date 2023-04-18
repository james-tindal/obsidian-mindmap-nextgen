import { Modal } from "obsidian"
import autoBind from "auto-bind"

import { FileSettings } from "./filesystem"
import { Dialog } from "./dialog"


export class FileSettingsDialog extends Modal {
  constructor(settings: FileSettings) {
    super(app)
    autoBind(this)

    this.containerEl.classList.add("mmng-settings-modal")

    this.onClose = () => this.contentEl.empty()
    this.onOpen = () => Dialog("codeBlock", settings)(this.contentEl)
  }
}
