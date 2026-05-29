// LAB-only positions for locked brand pigments.
// Contains no names, pigment codes, or hex values — those live in the gitignored premium.ts.
// These stubs allow the Gamut Map to render grey placeholder dots on builds where premium.ts
// is absent, so the sidebar legend ("Dim dots = locked brands") stays accurate everywhere.

export type PigmentStub = { brand: string; lab: { L: number; a: number; b: number } }

export const PIGMENT_STUBS: PigmentStub[] = [
  // Winsor & Newton
  { brand: 'Winsor & Newton Artists Oil', lab: { L: 94.1, a: 0, b: 2.2 } },
  { brand: 'Winsor & Newton Artists Oil', lab: { L: 60.7, a: 12.8, b: 59.1 } },
  { brand: 'Winsor & Newton Artists Oil', lab: { L: 38.2, a: 41.1, b: 36.6 } },
  { brand: 'Winsor & Newton Artists Oil', lab: { L: 22.4, a: 20.2, b: 25.3 } },
  { brand: 'Winsor & Newton Artists Oil', lab: { L: 44.2, a: 63.8, b: 45.4 } },
  { brand: 'Winsor & Newton Artists Oil', lab: { L: 26.3, a: 20.4, b: -47.7 } },
  { brand: 'Winsor & Newton Artists Oil', lab: { L: 18, a: 15.9, b: -40.9 } },
  { brand: 'Winsor & Newton Artists Oil', lab: { L: 34.6, a: 15.3, b: -48.9 } },
  { brand: 'Winsor & Newton Artists Oil', lab: { L: 9.4, a: 0.5, b: 1.7 } },
  // Williamsburg
  { brand: 'Williamsburg Handmade Oil', lab: { L: 95.6, a: 0.1, b: 1.7 } },
  { brand: 'Williamsburg Handmade Oil', lab: { L: 64.2, a: 11.4, b: 56.8 } },
  { brand: 'Williamsburg Handmade Oil', lab: { L: 38.5, a: 41.6, b: 41 } },
  { brand: 'Williamsburg Handmade Oil', lab: { L: 34.1, a: 12, b: 29.9 } },
  { brand: 'Williamsburg Handmade Oil', lab: { L: 27.6, a: 22.4, b: -50.5 } },
  { brand: 'Williamsburg Handmade Oil', lab: { L: 7.4, a: 0.5, b: 1.6 } },
  // Rembrandt
  { brand: 'Rembrandt Artists Oil', lab: { L: 94.2, a: 0.3, b: 1.2 } },
  { brand: 'Rembrandt Artists Oil', lab: { L: 85.2, a: 2, b: 81.9 } },
  { brand: 'Rembrandt Artists Oil', lab: { L: 61.7, a: 13.7, b: 57.4 } },
  { brand: 'Rembrandt Artists Oil', lab: { L: 38.9, a: 40.8, b: 39.4 } },
  { brand: 'Rembrandt Artists Oil', lab: { L: 23.2, a: 20, b: 26.2 } },
  { brand: 'Rembrandt Artists Oil', lab: { L: 44.1, a: 63.6, b: 49.2 } },
  { brand: 'Rembrandt Artists Oil', lab: { L: 20.3, a: 24.7, b: -47.4 } },
  { brand: 'Rembrandt Artists Oil', lab: { L: 32.1, a: 15.6, b: -48.2 } },
  { brand: 'Rembrandt Artists Oil', lab: { L: 8.4, a: 0.5, b: 1.7 } },
  // Utrecht
  { brand: 'Utrecht Artists Oil', lab: { L: 94.1, a: -0.4, b: 3.1 } },
  { brand: 'Utrecht Artists Oil', lab: { L: 89.3, a: -5.7, b: 81.5 } },
  { brand: 'Utrecht Artists Oil', lab: { L: 60.8, a: 13.1, b: 56.4 } },
  { brand: 'Utrecht Artists Oil', lab: { L: 57.2, a: 23.1, b: 49.7 } },
  { brand: 'Utrecht Artists Oil', lab: { L: 37.8, a: 40.4, b: 36.1 } },
  { brand: 'Utrecht Artists Oil', lab: { L: 31.3, a: 14.5, b: 31.1 } },
  { brand: 'Utrecht Artists Oil', lab: { L: 22.4, a: 20.2, b: 25.3 } },
  { brand: 'Utrecht Artists Oil', lab: { L: 44, a: 64, b: 49.1 } },
  { brand: 'Utrecht Artists Oil', lab: { L: 27.6, a: 43.9, b: 12.7 } },
  { brand: 'Utrecht Artists Oil', lab: { L: 26.2, a: 20.1, b: -47.8 } },
  { brand: 'Utrecht Artists Oil', lab: { L: 34.7, a: 11, b: -43.9 } },
  { brand: 'Utrecht Artists Oil', lab: { L: 19.1, a: 17.1, b: -42.9 } },
  { brand: 'Utrecht Artists Oil', lab: { L: 45.7, a: -28.1, b: 11.6 } },
  { brand: 'Utrecht Artists Oil', lab: { L: 26.6, a: -24, b: 2.8 } },
  { brand: 'Utrecht Artists Oil', lab: { L: 8.4, a: 0.5, b: 1.7 } },
  // Geneva
  { brand: 'Geneva Artists Oil', lab: { L: 94.8, a: 0, b: 2.2 } },
  { brand: 'Geneva Artists Oil', lab: { L: 89.1, a: -6.7, b: 79 } },
  { brand: 'Geneva Artists Oil', lab: { L: 81.3, a: 10.1, b: 80.4 } },
  { brand: 'Geneva Artists Oil', lab: { L: 44.1, a: 63.6, b: 49.2 } },
  { brand: 'Geneva Artists Oil', lab: { L: 35.1, a: 54.4, b: 23.8 } },
  { brand: 'Geneva Artists Oil', lab: { L: 30.5, a: 48.1, b: 17.1 } },
  { brand: 'Geneva Artists Oil', lab: { L: 18.7, a: 28.6, b: -50.1 } },
  { brand: 'Geneva Artists Oil', lab: { L: 20.1, a: 17.4, b: -43.9 } },
  { brand: 'Geneva Artists Oil', lab: { L: 15.3, a: 25.4, b: -23.6 } },
  { brand: 'Geneva Artists Oil', lab: { L: 22.4, a: 20.2, b: 25.3 } },
  { brand: 'Geneva Artists Oil', lab: { L: 9.7, a: 2.5, b: -3.8 } },
]
