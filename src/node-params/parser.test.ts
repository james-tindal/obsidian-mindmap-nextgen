import { describe, it, expect } from 'vitest'
import { parseNodeParams } from './parser'

describe('parseNodeParams', () => {
  it('parses bgColor with letter string', () => {
    const result = parseNodeParams('bgColor: red')
    expect(result.bgColor).toBe('red')
  })

  it('parses bgColor with hex color', () => {
    const result = parseNodeParams('bgColor: #ff0000')
    expect(result.bgColor).toBe('#ff0000')
  })

  it('parses color with letter string', () => {
    const result = parseNodeParams('color: white')
    expect(result.color).toBe('white')
  })

  it('parses color with hex color', () => {
    const result = parseNodeParams('color: #ffffff')
    expect(result.color).toBe('#ffffff')
  })

  it('parses nodeColor with letter string', () => {
    const result = parseNodeParams('nodeColor: blue')
    expect(result.nodeColor).toBe('blue')
  })

  it('parses nodeColor with hex color', () => {
    const result = parseNodeParams('nodeColor: #0000ff')
    expect(result.nodeColor).toBe('#0000ff')
  })

  it('parses fold with value "this"', () => {
    const result = parseNodeParams('fold: this')
    expect(result.fold).toBe('this')
  })

  it('parses fold with value "tree"', () => {
    const result = parseNodeParams('fold: tree')
    expect(result.fold).toBe('tree')
  })

  it('parses multiple semicolon-separated pairs', () => {
    const result = parseNodeParams('bgColor: red; color: white; fold: this')
    expect(result.bgColor).toBe('red')
    expect(result.color).toBe('white')
    expect(result.fold).toBe('this')
  })

  it('parses all color keys combined with fold', () => {
    const result = parseNodeParams('nodeColor: green; bgColor: #123456; color: blue; fold: tree')
    expect(result.nodeColor).toBe('green')
    expect(result.bgColor).toBe('#123456')
    expect(result.color).toBe('blue')
    expect(result.fold).toBe('tree')
  })

  it('returns empty object for empty input', () => {
    const result = parseNodeParams('')
    expect(result).toEqual({})
  })

  it('ignores unknown keys', () => {
    const result = parseNodeParams('unknown: value; bgColor: red')
    expect(result.bgColor).toBe('red')
    expect(result).not.toHaveProperty('unknown')
  })

  it('ignores invalid fold value', () => {
    const result = parseNodeParams('fold: invalid; bgColor: red')
    expect(result).not.toHaveProperty('fold')
    expect(result.bgColor).toBe('red')
  })
  
  it('ignores hex fold value', () => {
    const result = parseNodeParams('fold: #fff; bgColor: red')
    expect(result).not.toHaveProperty('fold')
    expect(result.bgColor).toBe('red')
  })

  it('ignores invalid key but parses valid pairs', () => {
    const result = parseNodeParams('badKey: red; color: white; fold: this')
    expect(result.color).toBe('white')
    expect(result.fold).toBe('this')
    expect(result).not.toHaveProperty('badKey')
  })

  it('handles double semicolons', () => {
    const result = parseNodeParams('bgColor: red;;color: white')
    expect(result.bgColor).toBe('red')
    expect(result.color).toBe('white')
  })

  it('handles whitespace-only segment', () => {
    const result = parseNodeParams('bgColor: red; ; color: white')
    expect(result.bgColor).toBe('red')
    expect(result.color).toBe('white')
  })

  it('handles leading whitespace', () => {
    const result = parseNodeParams('  bgColor: red; color: white')
    expect(result.bgColor).toBe('red')
    expect(result.color).toBe('white')
  })

  it('handles missing colon with space', () => {
    const result = parseNodeParams('bgColor  red; color: white')
    expect(result.color).toBe('white')
  })

  it('handles trailing semicolon', () => {
    const result = parseNodeParams('bgColor: red; color: white;')
    expect(result.bgColor).toBe('red')
    expect(result.color).toBe('white')
  })

  it('handles only a semicolon', () => {
    const result = parseNodeParams(';')
    expect(result).toEqual({})
  })

  it('parses keys case-insensitively', () => {
    const result = parseNodeParams('BGCOLOR: red; COLOR: white; NODECOLOR: blue; FOLD: this')
    expect(result.bgColor).toBe('red')
    expect(result.color).toBe('white')
    expect(result.nodeColor).toBe('blue')
    expect(result.fold).toBe('this')
  })

  it('parses values case-insensitively', () => {
    const result = parseNodeParams('bgColor: RED; color: WHITE; nodeColor: BLUE')
    expect(result.bgColor).toBe('RED')
    expect(result.color).toBe('WHITE')
    expect(result.nodeColor).toBe('BLUE')
  })

  it('ignores whitespace around colons and values', () => {
    const result = parseNodeParams('bgColor : red ; color : white')
    expect(result.bgColor).toBe('red')
    expect(result.color).toBe('white')
  })

  it('parses short hex color', () => {
    const result = parseNodeParams('bgColor: #fff')
    expect(result.bgColor).toBe('#fff')
  })

  it('ignores invalid hex color', () => {
    const result = parseNodeParams('bgColor: #xyz; color: red')
    expect(result).not.toHaveProperty('bgColor')
    expect(result.color).toBe('red')
  })

  it('ignores invalid hex color with wrong length', () => {
    const result = parseNodeParams('bgColor: #ff00; color: red')
    expect(result).not.toHaveProperty('bgColor')
    expect(result.color).toBe('red')
  })
})
