export const TOOLS = [
  'value-map',
  'notan',
  'color-picker',
  'shape-simplify',
  'dither',
  'grid',
  'composition',
  'sighting',
  'harmonies',
  'palette',
  'temperature',
  'paint-mix',
  'histogram',
  'edges',
  'sketch',
  'view-catcher',
  'colour-studio',
  'automated-sketch',
  'gamut-mask',
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
  'sighting':       'Sighting',
  'harmonies':      'Harmonies',
  'palette':        'Palette',
  'temperature':    'Temperature',
  'paint-mix':      'Paint Mix',
  'histogram':      'Histogram',
  'edges':          'Edges',
  'sketch':         'Sketch',
  'view-catcher':   'ViewCatcher',
  'colour-studio':  'Colour Studio',
  'automated-sketch': 'Automated Sketch',
  'gamut-mask':       'Gamut Map',
}

export const TOOL_DESCRIPTIONS: Record<Tool, string> = {
  'value-map':      'Posterize to N tonal values to study light and shadow structure.',
  'notan':          'Reduce to pure black and white shapes for compositional clarity.',
  'color-picker':   'Sample any point on your reference and copy the hex to clipboard.',
  'shape-simplify': 'Blur and posterize to isolate big shapes and lose fine detail.',
  'dither':         'Break tones into graphic patterns using error-diffusion or Bayer matrices.',
  'grid':           'Overlay a proportional grid to check angles and placement.',
  'composition':    'Overlay rule-of-thirds, phi grid, diagonals, or golden spiral guides.',
  'sighting':       'Measure angles, proportions, and alignment with draggable pins and a plumb line.',
  'harmonies':      'Generate and explore five harmonic colour schemes from any base colour.',
  'palette':        'Extract the dominant colours from your reference using K-means.',
  'temperature':    'Highlight warm and cool zones mapped across the image.',
  'paint-mix':      'Match reference colours to your paint brand with a 2-paint mix suggestion.',
  'histogram':      'Visualize the tonal distribution and spot clipping or low contrast.',
  'edges':          'Reveal edge types with Sobel detection — find lost and found edges.',
  'sketch':         'Draw value thumbnails directly over the reference with stylus support.',
  'view-catcher':   'Frame your reference with an interactive crop — try aspect ratios, save as a new image.',
  'colour-studio':  'Swatches, paint matches and harmonies — unified colour analysis in one view.',
  'automated-sketch': 'Composites edge-detection linework over simplified colour planes for a hand-drawn look.',
  'gamut-mask':     'Plot every colour on the LAB wheel — temperature bias, chroma spread, where your paints sit.',
}

/** Nineteen tools is a wall unless they arrive as families. One source of truth:
 * the landing page and the tool menu both render from this. */
export const TOOL_GROUPS: { name: string; purpose: string; tools: Tool[] }[] = [
  {
    name: 'Value & light',
    purpose: 'Take the colour away and read the light structure underneath.',
    tools: ['notan', 'value-map', 'shape-simplify', 'histogram', 'dither'],
  },
  {
    name: 'Colour',
    purpose: 'Pull the palette apart — what is actually there, and how you would mix it.',
    tools: ['colour-studio', 'palette', 'harmonies', 'temperature', 'paint-mix', 'gamut-mask', 'color-picker'],
  },
  {
    name: 'Drawing & proportion',
    purpose: 'Measure before you commit: angles, placement, and the frame itself.',
    tools: ['grid', 'sighting', 'composition', 'view-catcher'],
  },
  {
    name: 'Edges & line',
    purpose: 'Find where edges harden and soften, and what the drawing underneath looks like.',
    tools: ['edges', 'sketch', 'automated-sketch'],
  },
]

if (import.meta.env.DEV) {
  const grouped = TOOL_GROUPS.flatMap(g => g.tools)
  const missing = TOOLS.filter(t => !grouped.includes(t))
  const duplicated = grouped.filter((t, i) => grouped.indexOf(t) !== i)
  if (missing.length || duplicated.length) {
    throw new Error(`TOOL_GROUPS drift — every tool needs exactly one group. Missing: [${missing}], duplicated: [${duplicated}]`)
  }
}
