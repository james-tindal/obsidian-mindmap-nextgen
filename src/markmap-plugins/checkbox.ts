import { ITransformPlugin } from 'markmap-lib'
import type { ParserInline } from 'markdown-it'

/*
 *  Display Obsidian checkboxes in the mindmap
 *  https://github.com/james-tindal/obsidian-mindmap-nextgen#checkboxes
 */

const parser: ParserInline.RuleInline = state => {
  if (state.pos !== 0) return false

  const match = /^ *-? *\[(?<state>[ xX])\] +/.exec(state.src)
  const checked = match?.groups?.state !== ' '
  const length = match?.[0].length!
  const token = `checkbox_${checked ? '' : 'un'}chkd`

  if (!match) return false

  state.push(token, token, 0)

  state.pos += length
  return true
}

export const checkBoxPlugin: ITransformPlugin = {
  name: 'checkbox',
  config: {
    versions: {
      checkbox: '1.0'
    }
  },
  transform: transformHooks => {
    transformHooks.parser.tap(md => {
      md.inline.ruler.push('checkbox', parser)

      md.renderer.rules.checkbox_chkd   = () => '<span class="mm-ng-checkbox-checked">✓&nbsp;</span>'
      md.renderer.rules.checkbox_unchkd = () => '<span class="mm-ng-checkbox-unchecked">✗&nbsp;</span>'
    })

    return {}
  }
}
