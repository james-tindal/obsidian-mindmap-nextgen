import { Transformer } from 'markmap-lib'
import { checkBoxPlugin } from './checkbox'

describe('markmap plugins: checkbox', () => {
  const transformer = new Transformer([checkBoxPlugin])
  const transform = transformer.transform.bind(transformer)

  test('1', () => {
    const markdown = '[ ] test'
    const response = transform(markdown)
    const actual = response.root.content
    const expected = '<span class="mm-ng-checkbox-unchecked">✗&nbsp;</span>test'
    
    expect(actual).toEqual(expected)
  })

  test('2', () => {
    const markdown = '- [ ] test'
    const response = transform(markdown)
    const actual = response.root.content
    const expected = '<span class="mm-ng-checkbox-unchecked">✗&nbsp;</span>test'
    
    expect(actual).toEqual(expected)
  })

  test('3', () => {
    const markdown =
      '* [ ] test\n' +
      '+ [x] test\n' +
      '- [X] test'
    const response = transform(markdown)
    const actual = response.root.children?.map(x => x.children![0].content)
    const expected = [
      '<span class="mm-ng-checkbox-unchecked">✗&nbsp;</span>test',
      '<span class="mm-ng-checkbox-checked">✓&nbsp;</span>test',
      '<span class="mm-ng-checkbox-checked">✓&nbsp;</span>test'
    ]

    expect(actual).toEqual(expected)
  })
})
