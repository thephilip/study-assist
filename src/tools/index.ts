export const TOOLS = [
  'value-map',
  'notan',
  'color-picker',
  'shape-simplify',
  'grid',
  'palette',
  'temperature',
  'paint-mix',
] as const

export type Tool = typeof TOOLS[number]
