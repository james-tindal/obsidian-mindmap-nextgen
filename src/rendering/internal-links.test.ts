import { Transformer } from 'markmap-lib'
import { updateInternalLinks } from './internal-links'

describe('markmap plugins: internal links', () => {
  const transformer = new Transformer()
  const transform = transformer.transform.bind(transformer)

  test('[[wikilink]]', () => {
    const markdown = '[[wikilink]]'
    const { root: rootNode } = transform(markdown)
    updateInternalLinks(rootNode)

    const actual = rootNode.content
    const expected = '<a href="wikilink">wikilink</a>'

    expect(actual).toEqual(expected)
  })

  test('[[wikilink|with display text]]', () => {
    const markdown = '[[wikilink|with display text]]'
    const { root: rootNode } = transform(markdown)
    updateInternalLinks(rootNode)

    const actual = rootNode.content
    const expected = '<a href="wikilink">with display text</a>'

    expect(actual).toEqual(expected)
  })

  test('[markdown link](url)', () => {
    const markdown = '[link text](url)'
    const { root: rootNode } = transform(markdown)

    const actual = rootNode.content
    const expected = '<a href="url">link text</a>'

    expect(actual).toEqual(expected)
  })

  test('[markdown link](url with space)', () => {
    const markdown = '[link text](url with space)'
    const { root: rootNode } = transform(markdown)

    const actual = rootNode.content
    const expected = '<a href="url with space">link text</a>'

    expect(actual).toEqual(expected)
  })
})
