import { PluginSettingTab } from "obsidian"

import Plugin from "src/main"
import { GlobalSettings } from "./filesystem"
import { Dialog } from "./dialog"


export class GlobalSettingsDialog extends PluginSettingTab {
  constructor(settings: GlobalSettings) {
    super(app, Plugin.instance)

    Dialog("global", settings)(this.containerEl)
  }

  public display() {}
}
