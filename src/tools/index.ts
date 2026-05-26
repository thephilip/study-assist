export const TOOLS = [
  'value-map',
  'notan',
  'color-picker',
  'shape-simplify',
  'dither',
  'grid',
  'composition',
  'harmonies',
  'palette',
  'temperature',
  'paint-mix',
  'histogram',
  'edges',
] as const

export type Tool = typeof TOOLS[number]

export const TOOL_LABELS: Record<Tool, string> = {
  'value-map':      'Value Map',
  'notan':          'Notan',
  'color-picker':   'Color Picker',
  'shape-simplify': 'Shape Simplify',
  'dither':         'Dither',
  'grid':           'Grid',
  'composition':    'Composition',
  'harmonies':      'Harmonies',
  'palette':        'Palette',
  'temperature':    'Temperature',
  'paint-mix':      'Paint Mix',
  'histogram':      'Histogram',
  'edges':          'Edges',
}
