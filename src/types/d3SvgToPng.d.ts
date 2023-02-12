type Options = {
  format: string
  scale: number
  quality: number
  download: boolean
  ignore: string
  cssinline: number
  background: string
}
export default function d3ToPng(selectorOrElement: string | Element, fileName: string, options?: Partial<Options>): Promise<string>
