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
    version: '1.16.0',
    date: '2026-07-19',
    entries: [
      { text: 'Fresh coat of paint: a refined dark theme with a deeper background, crisper text, tighter corners, and a new indigo accent — plus an updated app icon', visibility: 'public' },
      { text: 'Sketch: Undo and Clear now enable the moment you finish a stroke, and Compare shows the original beside your sketch', visibility: 'public' },
      { text: 'Bug fixes and improvements', visibility: 'hidden' },
    ],
  },
  {
    version: '1.15.1',
    date: '2026-05-28',
    entries: [
      { text: 'You can now redeem an unlock code directly from the upgrade prompt — no need to visit a separate page', visibility: 'public' },
      { text: 'Controls panel stagger animation now replays each time the panel is expanded', visibility: 'hidden' },
    ],
  },
  {
    version: '1.15.0',
    date: '2026-05-28',
    entries: [
      { text: 'New tool: Gamut Map — plots every colour in your reference on the LAB a*–b* plane so you can see your image\'s colour strategy at a glance. Includes pigment overlay showing where your paints fall in the same space.', visibility: 'public' },
    ],
  },
  {
    version: '1.14.2',
    date: '2026-05-28',
    entries: [
      { text: 'Controls panel now fades in items with a gentle stagger on load', visibility: 'public' },
      { text: 'Modals now animate in with a subtle scale + fade entrance', visibility: 'public' },
      { text: 'Bug fixes and improvements', visibility: 'hidden' },
    ],
  },
  {
    version: '1.14.1',
    date: '2026-05-27',
    entries: [
      { text: 'Fix mobile chevron — controls panel collapse toggle was off-screen on mobile (≤640px); now centred on the top border seam with correct down/up rotation', visibility: 'public' },
      { text: 'Bug fixes and improvements', visibility: 'hidden' },
    ],
  },
  {
    version: '1.14.0',
    date: '2026-05-27',
    entries: [
      { text: 'Collapsible controls panel — collapse/expand with per-tool localStorage persistence, animated chevron, and staggered children (deferred follow-up)', visibility: 'public' },
      { text: 'Refined header and wordmark — tightened spacing, hover states, consolidated Actions/Tools triggers', visibility: 'public' },
      { text: 'Consolidated modals — shared UpgradeModal component, improved animation and dismiss behaviour', visibility: 'public' },
      { text: 'Design tokens audit — new accent-subtle and accent-muted-hover tokens, animation system (easing curves + duration steps), eliminated hardcoded accent rgba values across all surfaces', visibility: 'public' },
      { text: 'Bug fixes and improvements', visibility: 'hidden' },
    ],
  },
  {
    version: '1.13.0',
    date: '2026-05-26',
    entries: [
      { text: 'New Automated Sketch tool — composites Sobel edge-detection linework over posterised colour planes for a hand-drawn sketch look; controls for colour blur, levels, edge blur, edge strength, opacity, and line colour', visibility: 'public' },
      { text: 'Bug fixes and improvements', visibility: 'hidden' },
    ],
  },
  {
    version: '1.12.0',
    date: '2026-05-26',
    entries: [
      { text: 'New Colour Studio tool — unified colour analysis combining palette extraction (K-means), paint matching (closest pigments + 2-paint mix), and harmonic colour schemes in one view', visibility: 'public' },
      { text: 'Bug fixes and improvements', visibility: 'hidden' },
    ],
  },
  {
    version: '1.11.0',
    date: '2026-05-26',
    entries: [
      { text: 'New ViewCatcher tool — try different aspect ratios with an interactive crop overlay; drag corners to resize, body to reposition, and save the crop as a new working image', visibility: 'public' },
      { text: 'Bug fixes and improvements', visibility: 'hidden' },
    ],
  },
  {
    version: '1.10.0',
    date: '2026-05-26',
    entries: [
      { text: 'New Sketch tool — draw value thumbnails directly over your reference with 2–8 greyscale levels, undo, eraser, and pressure-sensitive stylus support', visibility: 'public' },
      { text: 'Multiple Mix Suggestions — Pro users can now see top-5 alternative 2-paint mixes and 3-paint combinations in the Paint Mix tool', visibility: 'public' },
      { text: 'Bug fixes and improvements', visibility: 'hidden' },
    ],
  },
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
