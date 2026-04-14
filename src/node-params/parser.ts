
type NodeParams = {
  color?: string
  nodeColor?: string
  bgColor?: string
  fold?: 'this' | 'tree'
}

const validFoldValues = ['this', 'tree']
const colorKeys = ['color', 'nodecolor', 'bgcolor']

export function parseNodeParams(input: string): NodeParams {
  const result: NodeParams = {}

  const trimmed = input.trim()
  if (!trimmed) return result

  const pairs = trimmed.split(';').map(s => s.trim()).filter(Boolean)

  for (const pair of pairs) {
    const colonIdx = pair.indexOf(':')
    if (colonIdx === -1) continue

    const key = pair.slice(0, colonIdx).trim().toLowerCase()
    const value = pair.slice(colonIdx + 1).trim()

    if (!key || !value) continue

    if (key === 'fold') {
      const foldVal = value.toLowerCase()
      if (validFoldValues.includes(foldVal))
        result.fold = foldVal as any
      continue
    }

    if (colorKeys.includes(key)) {
      const isHex3 = /^#[0-9a-fA-F]{3}$/.test(value)
      const isHex6 = /^#[0-9a-fA-F]{6}$/.test(value)
      const isLetterString = /^[a-zA-Z]+$/.test(value)
      const isValid = isHex3 || isHex6 || isLetterString
      if (!isValid)
        continue
      if (key === 'bgcolor')
        result.bgColor = value
      if (key === 'nodecolor')
        result.nodeColor = value
      if (key === 'color')
        result.color = value
    }
  }

  return result
}
