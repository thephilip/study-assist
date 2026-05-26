export type ChangelogVisibility = 'public' | 'hidden'

export interface ChangelogEntry {
  text: string
  visibility: ChangelogVisibility
}

export interface ChangelogRelease {
  version: string
  date: string
  entries: ChangelogEntry[]
}

export const CHANGELOG: ChangelogRelease[] = [
  {
    version: '1.9.0',
    date: '2026-05-26',
    entries: [
      { text: 'New Color Harmonies tool — pick a base colour and see complementary, analogous, triadic, split-complementary, and tetradic schemes, with optional pigment matching against your paint brands', visibility: 'public' },
      { text: 'Bug fixes and improvements', visibility: 'hidden' },
    ],
  },
  {
    version: '1.8.0',
    date: '2026-05-26',
    entries: [
      { text: 'New Sighting tool — measure angles, proportions, and alignment directly on your reference with draggable pin markers and a plumb line guide', visibility: 'public' },
      { text: 'Bug fixes and improvements', visibility: 'hidden' },
    ],
  },
  {
    version: '1.7.0',
    date: '2026-05-26',
    entries: [
      { text: 'Mirror and Flip vertical — one-tap toggles in the Actions menu to flip your reference horizontally or vertically', visibility: 'public' },
      { text: 'Bug fixes and improvements', visibility: 'hidden' },
    ],
  },
  {
    version: '1.6.0',
    date: '2026-05-26',
    entries: [
      { text: 'Actions menu — Compare, Save PNG, and Use as source are now in a single Actions menu consistent across all tools', visibility: 'public' },
      { text: 'On mobile, a Tools button in the header lets you switch tools without the scrolling toolbar taking up screen space', visibility: 'public' },
      { text: 'Bug fixes and improvements', visibility: 'hidden' },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-05-25',
    entries: [
      { text: 'Larger touch targets — all buttons, toggles, and slider thumbs now meet 44×44px minimum on tablet', visibility: 'public' },
      { text: 'Composition spiral orientation now shows visible TL/TR/BL/BR labels instead of invisible title attributes', visibility: 'public' },
      { text: 'Bug fixes and improvements', visibility: 'hidden' },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-05-25',
    entries: [
      { text: 'Single-finger pan — drag to navigate when zoomed in on any canvas tool', visibility: 'public' },
      { text: 'Bug fixes and improvements', visibility: 'hidden' },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-05-25',
    entries: [
      { text: 'New Composition tool — rule of thirds, phi grid, diagonals, golden spiral, and centre crosshair overlays', visibility: 'public' },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-05-25',
    entries: [
      { text: 'Bug fixes and improvements', visibility: 'hidden' },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-05-25',
    entries: [
      { text: 'New Dither tool — Floyd-Steinberg, Atkinson, Bayer 4×4 and 8×8 algorithms', visibility: 'public' },
      { text: 'Use as source — apply any tool\'s output as the working image and chain effects', visibility: 'public' },
      { text: 'Undo stack — step back through applied changes', visibility: 'public' },
      { text: 'Compare always shows the original source image, not a previously-processed version', visibility: 'public' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-05-01',
    entries: [
      { text: 'Initial release', visibility: 'public' },
    ],
  },
]

export const CURRENT_VERSION = CHANGELOG[0].version
