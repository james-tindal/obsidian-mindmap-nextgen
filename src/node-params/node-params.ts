import { IPureNode } from 'markmap-common'
import { parseNodeParams as parseParams } from './parser'


export function nodeParams(node: IPureNode, inheritedNodeColor?: string) {
  const comment = node.content.match(/<!--([\s\S]*?)-->/)?.[1] || ''
  const { nodeColor: newNodeColor, bgColor, color: textColor, fold } = parseParams(comment)

  if (bgColor || textColor) {
    const styles: string[] = []
    if (bgColor)   styles.push(`background-color: ${bgColor}`)
    if (textColor) styles.push(`color: ${textColor}`)
    const styleStr = styles.join('; ')
    node.content = `<span style="${styleStr}">${node.content}</span>`
  }

  const nodeColor = newNodeColor ?? inheritedNodeColor
  if (!node.payload)
    node.payload = {}
  if (nodeColor)
    node.payload.nodeColor = nodeColor
  if (fold)
    node.payload.fold = fold === 'this' ? 1 : 2

  node.children.forEach(child => nodeParams(child, nodeColor))
}
