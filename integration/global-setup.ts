import { readFileSync } from 'node:fs'
import { createSetup } from 'obsidian-integration-testing/vitest-global-setup-plugin'

const manifest = readFileSync('manifest.json', 'utf8')
const { id } = JSON.parse(manifest) as { id: string }
const codeblock = '```markmap\n# Root\n## [[target]]\n### Third\n## Other\n```'

export const { setup, teardown } = createSetup({
  installPlugin: false,
  enableCommunityPlugins: [id],
  populate: () => ({
    [`.obsidian/plugins/${id}/manifest.json`]: manifest,
    [`.obsidian/plugins/${id}/main.js`]: readFileSync('main.js'),
    [`.obsidian/plugins/${id}/styles.css`]: readFileSync('styles.css'),
    '.obsidian/page-preview.json': JSON.stringify({ preview: false }),
    'Source/map.md': `---\nmarkmap:\n  animationDuration: 0\n  coloring: single\n  defaultColor: "#123456"\n---\n\n${codeblock}`,
    'Source/target.md': '# Correct target',
    'Host/target.md': '# Wrong target',
    'Host/embed.md': '---\nmarkmap:\n  coloring: single\n  defaultColor: "#ff0000"\n---\n\n![[Source/map]]',
    'Host/hover.md': '[[Source/map]]',
    'Host/file.canvas': JSON.stringify({
      nodes: [{ id: 'map', type: 'file', file: 'Source/map.md', x: 0, y: 0, width: 500, height: 360 }],
      edges: [],
    }),
    'Host/text.canvas': JSON.stringify({
      nodes: [{ id: 'map', type: 'text', text: codeblock, x: 0, y: 0, width: 500, height: 360 }],
      edges: [],
    }),
  }),
})
