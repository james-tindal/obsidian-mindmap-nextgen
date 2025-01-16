import { INode, IPureNode, walkTree } from 'markmap-common'
import { Transformer } from 'markmap-lib'
import { Markmap } from 'markmap-view'
import { depthColoring } from 'src/rendering/renderer-common'
import { CodeBlockSettings } from 'src/settings/filesystem'

// @vitest-environment jsdom

/**
 * Skipped test
 * 
 * This test fails with JSDOM but passes in Electron
 * Markmap.create is failing to add the stroke attribute to the svg line
 * 
 * This better illustrates how it's used
 * and tests a more complete integration
 * 
 * To do: debug Markmap.create code and figure out where it's going wrong
 */
test.skip('depth coloring', () => {
  const transformer = new Transformer()
  const transform = transformer.transform.bind(transformer)

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const markdown =
    [ '* a'
    , '  * b'
    , '    * c'
    ].join('\n')
  const { root: rootNode } = transform(markdown)
  const settings = {
    depth1Color: '#aaaaaa',
    depth2Color: '#bbbbbb',
    depth3Color: '#cccccc'
  } as CodeBlockSettings
  const options = { color: depthColoring(settings) }
  const markmap = Markmap.create(svg, options, rootNode)
  markmap.setData(rootNode, options)

  const depth = (n: number) =>
    svg.querySelector(`g[data-depth='${n}'] line`)?.getAttribute('stroke')

  expect(depth(0)).toEqual(settings.depth1Color)
  expect(depth(1)).toEqual(settings.depth2Color)
  expect(depth(2)).toEqual(settings.depth3Color)
})

/**
 * Not as good a test as the previous, but avoids JSDOM issue
 */
test('depth coloring', () => {
  const transformer = new Transformer()
  const transform = transformer.transform.bind(transformer)

  const markdown =
    [ '* a'
    , '  * b'
    , '    * c'
    ].join('\n')
  const { root: rootNode } = transform(markdown)
  const settings = {
    depth1Color: '#aaaaaa',
    depth2Color: '#bbbbbb',
    depth3Color: '#cccccc'
  } as CodeBlockSettings

  const colours: string[] = []
  walkTree(rootNode, (node, next) => {
    // not totally sure what to do about INode vs IPureNode
    if (!hasDepth(node)) throw 'node has no depth'
    colours.push(depthColoring(settings)(node))
    next()
  })

  expect(colours).toEqual([
    settings.depth1Color,
    settings.depth2Color,
    settings.depth3Color
  ])
})

const hasDepth = (x: IPureNode): x is INode => 'depth' in x
