import { ButtonComponent, Setting } from 'obsidian'
import { Component, div, fragment } from './various'
import { Resolve } from 'src/utilities/utilities'
import { fromEntries } from 'src/utilities/entries'

type Level = 'global' | 'file' | 'codeBlock'
export const PageSelector = (initialPage: Level, pages: Record<Level, () => Component>) => (parent: Node) => {
  const selector = new Setting(createFragment())
  const pageContainer = div([], 'mmng-main')

  const buttons = fromEntries(
    (['global', 'file', 'codeBlock'] as const)
    .map(level => [level,
      Resolve<ButtonComponent>(resolve => selector.addButton(resolve))
        .setButtonText(level)
        .onClick(() => showPage(level))
    ])
  ) as Record<Level, ButtonComponent>

  let activeButton: ButtonComponent
  
  function showPage(level: Level) {
    pageContainer.node.replaceChildren(pages[level]().node)

    activeButton?.buttonEl.removeClass('mmng-active')
    activeButton = buttons[level]
    activeButton.buttonEl.addClass('mmng-active')
  }

  showPage(initialPage)

  const component = fragment([
    div([Component(selector.settingEl)], 'mmng-level-selector'),
    pageContainer
  ])

  parent.appendChild(component.node)
}
