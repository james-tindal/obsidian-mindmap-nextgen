import { IPureNode } from 'markmap-common'


const NODE_PROPS = ['color', 'nodeColor', 'bgColor', 'fold'] as const
type NodeProp = typeof NODE_PROPS[number]

function extractFromComment(commentContent: string): {
  extracted: Partial<Record<NodeProp, string>>
  remaining: string
} {
  const declarations = commentContent.split(';').map(s => s.trim()).filter(Boolean)
  const extracted: Partial<Record<NodeProp, string>> = {}
  const remaining: string[] = []

  for (const decl of declarations) {
    const colonIdx = decl.indexOf(':')
    if (colonIdx === -1) { remaining.push(decl); continue }
    const prop = decl.slice(0, colonIdx).trim()
    const value = decl.slice(colonIdx + 1).trim()
    if ((NODE_PROPS as readonly string[]).includes(prop)) {
      extracted[prop as NodeProp] = value
    } else {
      remaining.push(decl)
    }
  }

  return { extracted, remaining: remaining.join('; ') }
}

function parseParams(content: string): {
  content: string
  nodeColor?: string
  bgColor?: string
  textColor?: string
  fold?: number
} {
  let nodeColor: string | undefined
  let bgColor: string | undefined
  let textColor: string | undefined
  let fold: number | undefined

  const result = content.replace(/<!--([\s\S]*?)-->/g, (_, inner) => {
    const { extracted, remaining } = extractFromComment(inner)
    if (extracted.nodeColor) nodeColor = extracted.nodeColor
    if (extracted.bgColor)   bgColor   = extracted.bgColor
    if (extracted.color)     textColor = extracted.color
    if (extracted.fold === 'this') fold = 1
    else if (extracted.fold === 'tree') fold = 2
    return remaining ? `<!-- ${remaining} -->` : ''
  })

  return { content: result.trim(), nodeColor, bgColor, textColor, fold }
}

function walk(node: IPureNode, inheritedNodeColor?: string) {
  const { content, nodeColor: ownNodeColor, bgColor, textColor, fold } = parseParams(node.content)

  let processedContent = content
  if (bgColor || textColor) {
    const styles: string[] = []
    if (bgColor)   styles.push(`background-color:${bgColor}`)
    if (textColor) styles.push(`color:${textColor}`)
    const styleStr = styles.join(';')

    const div = document.createElement('div')
    div.innerHTML = processedContent
    const p = div.querySelector('p')
    if (p) {
      if (bgColor)   p.style.backgroundColor = bgColor
      if (textColor) p.style.color = textColor
      processedContent = div.innerHTML
    } else {
      processedContent = `<span style="${styleStr}">${processedContent}</span>`
    }
  }

  node.content = processedContent

  const nodeColor = ownNodeColor ?? inheritedNodeColor
  if (nodeColor || fold !== undefined)
    node.payload = { ...node.payload, ...(nodeColor && { nodeColor }), ...(fold !== undefined && { fold }) }

  node.children?.forEach(child => walk(child, nodeColor))
}

export function parseNodeParams(root: IPureNode) {
  walk(root)
}
