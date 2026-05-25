export const TOOLS = [
  'value-map',
  'notan',
  'color-picker',
  'shape-simplify',
  'dither',
  'grid',
  'composition',
  'palette',
  'temperature',
  'paint-mix',
  'histogram',
  'edges',
] as const

export type Tool = typeof TOOLS[number]
