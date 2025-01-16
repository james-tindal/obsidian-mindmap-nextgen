import { Transformer } from 'markmap-lib'
import { htmlEscapePlugin } from './html-escape'

describe('markmap plugins: html escape', () => {
  const transformer = new Transformer([htmlEscapePlugin])
  const transform = transformer.transform.bind(transformer)

  test('1', () => {
    const markdown = '<><<><>>>>><'
    const response = transform(markdown)
    const actual = response.root.content
    const expected = '&lt;&gt;&lt;&lt;&gt;&lt;&gt;&gt;&gt;&gt;&gt;&lt;'

    console.log(response)
    
    expect(actual).toEqual(expected)
  })

  test('if a line starts with >, that character is removed', () => {
       'because that starts a callout'
    const markdown = '><><<><>>>>><'
    const response = transform(markdown)
    const actual = response.root.content
    const expected = '&lt;&gt;&lt;&lt;&gt;&lt;&gt;&gt;&gt;&gt;&gt;&lt;'

    console.log(response)
    
    expect(actual).toEqual(expected)
  })
})
