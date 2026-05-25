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
