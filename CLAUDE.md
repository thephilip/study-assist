# study-assist

A painting reference tool for artists — value maps, notan, colour picking, paint mixing, and more in one place, built with a clean, accessible, dark-mode-first UI. A purpose-built native tablet app (iOS/Android) will follow the web release.

## Project Goals

- Replace the fragmented artist workflow: notan, value map, color picker, shape simplification, paint mixing — all in one place
- Process images entirely on-device (no uploads, no accounts required for core features)
- Tablet-first interaction model for the native app (used at the easel, not at a desk)
- Non-distracting UI that gets out of the way of the artist's work

## Target Users

Painters (oil, acrylic, watercolor, digital) who study reference photos before or during a painting session. Primary device for native app: iPad and Android tablets.

## Tech Stack

### Web App (Phase 1)
- **Framework:** Vite + React 19 + TypeScript (strict)
- **Package manager:** pnpm
- **Styling:** CSS Modules + CSS custom properties (design tokens in `src/tokens/index.css`)
- **Image processing:** browser Canvas API + `getImageData` pixel manipulation; heavy algorithms run in Web Workers
- **No server-side processing** — everything runs locally in the browser (privacy promise)
- **Dev server:** `pnpm dev` → http://localhost:5173

### Native Tablet App (Phase 2)
- **Not React Native** — purpose-built native, likely Flutter (single Dart codebase → iOS + Android)
- Decision deferred until Phase 1 ships

## Source Layout

```
src/
  components/       # UI primitives: Panel, Slider, ImageDrop
  hooks/            # useImage (file→ImageBitmap), useProcessedCanvas
  lib/
    canvas.ts       # getPixelData, putPixelData, drawImageToCanvas, mapPixels
    color.ts        # RGB↔HSL↔LAB↔CMYK conversions + deltaE
    pigments/       # (Sprint 8) paint brand database
  tokens/
    index.css       # all design tokens (colours, type, spacing, radii, shadows)
  tools/            # one .ts (logic) + .tsx (component) per feature
  workers/
    kmeans.worker.ts
```

### Tool registry (`src/tools/index.ts`)
All tool slugs are defined here. `App.tsx` dispatches to the right component via `ActiveTool`.

### Actions menu (planned)
Not everything a painter does needs a dedicated tool (canvas + controls panel). Some operations are **Actions** — instant view transformations that apply on top of whatever tool is active:

- **Mirror / Flip** — CSS `scaleX(-1)` toggle on the canvas wrapper; reversible, no pixel reprocessing
- **Flip vertical** — same approach, `scaleY(-1)`
- **Reset view** — reset zoom/pan to 1× centred
- **Reset image** — undo all Use-as-source changes back to original

Actions live in an **Actions dropdown** in the app header, alongside Undo and Remove image. They're always accessible regardless of the active tool. Overlay coordinates (color picker ring, grid, composition guides) must read a shared flip/transform state from context.

**Responsive behaviour:** On desktop (mouse), a compact dropdown with 32px-tall menu items. On touch devices (`@media (hover: none) and (pointer: coarse)`), a **bottom sheet** slides up from the viewport bottom with 56px-tall rows, a grab handle for swipe-to-dismiss, backdrop dim, and top-corner-only border radius. The trigger button in the header is identical in both layouts — only the menu presentation changes. See `actions-mockup.svg` for the full visual design.

This distinction keeps the toolbar for what it's best at: navigating between deep, stateful image-processing features. Quick imperatives live in the header.

## Core Features — Build Status

| Feature | Status | Notes |
|---|---|---|---|
| Value map | ✅ done | BT.601 luma + N-level posterization |
| Notan | ✅ done | Luma threshold → pure black/white |
| Color picker | ✅ done | Circular region sampling; hover preview, click to lock; copies hex |
| Shape simplification | ✅ done | Separable box blur (O(w×h)) + posterize |
| Grid overlay | ✅ done | Preset buttons, col/row sliders, opacity, white/black toggle |
| Color palette extraction | ✅ done | K-means++ in a Web Worker; proportional swatch bar |
| Temperature map | ✅ done | Per-pixel HSL hue → warm/cool overlay |
| Paint mixing guidance | ✅ done | LAB math + pigment database (key differentiator) |
| Composition overlay | ✅ done | Rule of thirds, phi grid, corner diagonals, golden spiral (4 orientations), centre crosshair |
| Sighting | ✅ done | Angle finder, proportion ratios, plumb line guide |
| Color Harmonies | ✅ done | 5 HSL-based schemes with optional pigment matching |
| Export / save | ✅ done | Save PNG button on all processed-canvas tools |
| Side-by-side view | ✅ done | Compare toggle on all processed-canvas tools; original kept in DOM for instant toggle |
| Histogram | ✅ done | Luma histogram with log/linear scale; min/mean/max tonal range stats |
| Edge detection overlay | ✅ done | Sobel edge detection; blur/threshold/opacity controls; white or black lines |
| Full-screen view | ✅ done | Fullscreen button overlay on all canvas tools via CanvasWrap; native Fullscreen API on desktop/Android; CSS pseudo-fullscreen fallback on iOS Safari (position:fixed overlay) |
| PWA / installable | ✅ done | manifest.json, icons (192/512px), favicon, OG tags, Apple meta tags; vite-plugin-pwa |
| Update notifications | ✅ done | Service worker update toast with Reload (skipWaiting) + dismiss |
| Pinch-to-zoom | ✅ done | Pinch (touch) + scroll-wheel zoom 1×–8×; double-tap to reset; zoom state in CanvasWrap via useReducer + ZoomContext |
| Use as source / Undo | ✅ done | Any processed-canvas tool can bake its output as the new working image; full undo stack in useImage (useReducer); compare always shows the root original |
| Dither | ✅ done | Floyd-Steinberg, Atkinson, Bayer 4×4/8×8; greyscale and colour modes; 2–8 quantization levels; supports compare, Save PNG, Use as source |
| Mirror / Flip | ✅ done | CSS `scaleX(-1)` / `scaleY(-1)` toggle in Actions menu |
| Thumbnail Sketch | ✅ done | Transparent drawing layer for value thumbnails; 2–8 greyscale levels; pressure-sensitive stylus support; undo stack |


Paint brand database (Gamblin, W&N, Williamsburg, Rembrandt) is a key differentiator — competitors lack this. **Brand gating is live:** Gamblin is the free tier; W&N, Williamsburg, and Rembrandt are locked behind an upgrade modal pointing to the native app.

## Design System

Tokens live in `src/tokens/index.css` and are consumed everywhere via CSS custom properties. Never use one-off colour or spacing values — always reach for a token.

Key tokens: `--color-bg`, `--color-surface`, `--color-accent`, `--color-text`, `--color-text-muted`, `--space-*`, `--radius-*`, `--text-*`, `--font-sans`, `--font-mono`.

Shared tool layout (`src/tools/Tool.module.css`): two-column — canvas fills left, 220px controls panel on right.

## Design Principles

- Dark mode by default (artists work in dim studios; bright UIs destroy night vision)
- Accessible: WCAG AA minimum, keyboard navigable, proper focus management
- Minimal chrome — tools should fade out during active study, not compete with the reference image
- Responsive: the web app should work well on a tablet browser as a bridge to the native app

## Development Notes

- All image processing must run client-side
- Pixel-math tools use `mapPixels()` from `lib/canvas.ts` — it clones ImageData and applies a per-pixel function
- Heavy algorithms (K-means, future palette work) belong in `src/workers/` — post an ArrayBuffer, return results
- Use `useProcessedCanvas(image, processData)` for transform tools; manage canvas manually when you need mouse events or overlays (see `ColorPicker.tsx`, `Grid.tsx`)
- `CanvasWrap` (`src/components/CanvasWrap.tsx`) wraps every tool's canvas area — it owns zoom state (pinch + wheel), fullscreen, and the compare layout. Fullscreen uses the native Fullscreen API where available; falls back to a CSS `position:fixed` overlay on iOS Safari. Use `useZoom()` in any tool that positions an overlay (indicator ring, crosshair dot) so coordinates stay accurate under zoom.
- Design tokens should cover every value — no one-off style values
- **Changelog:** whenever a feature ships, prepend a new release object to `CHANGELOG` in `src/lib/changelog.ts` and bump the version string. Each entry needs `text` and `visibility: 'public' | 'hidden'` — hidden entries render as "Bug fixes and improvements" in the modal. The modal is triggered automatically on next load when `CHANGELOG[0].version` differs from `localStorage.lastSeenVersion`.

## Premium pigment data — `src/lib/pigments/premium.ts`

All locked brand entries (W&N, Williamsburg, Rembrandt, Utrecht, Geneva) live in `src/lib/pigments/premium.ts`, which is **gitignored** and never committed to the public repo. `index.ts` imports `PREMIUM_SPECS` from it and maps the tuples through `p()` at the bottom of the `PIGMENTS` array. The file must be present locally for the build to succeed — back it up outside the repo (e.g. an encrypted notes app or private cloud file). If you set up on a new machine, restore this file before running `pnpm dev` or `pnpm build`.

`premium.ts` exports a single `PREMIUM_SPECS` array of `[id, name, brand, pigmentCode, hex]` tuples — no imports, no dependencies. This format is intentionally compatible with a future private npm package (e.g. `@study-assist/premium-pigments`) if the project ever moves to a CI/CD pipeline that builds from source — the package would export the same `PREMIUM_SPECS` shape and `index.ts` would need no changes. That is purely a build-pipeline concern; user-facing unlocks are handled by native app IAP, not package distribution.

## Adding a new paint brand

1. **`src/lib/pigments/index.ts`**
   - Add the brand name to the `Brand` union type
   - Add it to `ALL_BRANDS` (controls display order in the UI)
   - Add it to `FREE_BRANDS` only if it should be free-tier; leave it out to gate it behind an unlock

2. **`src/lib/pigments/premium.ts`** *(gitignored)*
   - If the brand is locked (not in `FREE_BRANDS`), add its entries here as tuples: `[id, name, brand, pigmentCode, hex]`. Use a short brand prefix for IDs. Hex values should come from manufacturer swatch cards or handprint.com; treat as D65 approximations, not spectral data.
   - If the brand is free-tier, add entries directly in `index.ts` alongside the Gamblin block instead.

2. **`src/tools/PaintMix.tsx`**
   - Add an entry to `BRAND_SHORT` (max ~7 chars to fit the button grid)

3. **`src/lib/entitlements.ts`** — no changes needed; gating is driven purely by `FREE_BRANDS`

### Populated brands
| Brand | ID prefix | Status | Colors |
|---|---|---|---|
| Utrecht Artists' Oil | `ut-` | locked | 15 colors: TW, Cad Yellow Lt, Yellow Ochre, Raw Sienna, Burnt Sienna, Raw Umber, Burnt Umber, Cad Red Med, Alizarin Crimson (PR83), Ultramarine, Cobalt, Phthalo Blue, Viridian, Phthalo Green, Ivory Black |
| Geneva Artists' Oil | `gv-` | locked | 11 colors: TW, Bismuth Yellow (PY184), Cad Yellow, Cad Red, Pyrrole Rubine (PR264), Perm Alizarin (PR177), French Ultramarine, Phthalo Blue (PB15:4), Dioxazine Purple (PV23), Burnt Umber, Geneva Black (PB29+PBr7) |

Geneva pigment codes confirmed from genevafineart.com product pages. Utrecht pigment codes are standard artist-grade formulations; hex values are reference approximations (D65, same basis as other brands).

## Competitive Landscape

| App | Strengths | Weaknesses |
|---|---|---|
| Value Study app | Clean, free | No color tools |
| Notanizer | Simple, $1.99 | Android/Mac only, no color |
| Tonal Value Tool | Browser-based, free | Utility-grade UI, no mixing |

## Monetization Strategy

**Decided:** free core app + paid brand pack IAP (in-app purchase). No backend, no subscription.

- **Free tier:** full access to all tools; pigment database includes Gamblin only (implemented — `FREE_BRANDS` constant in `src/lib/pigments/index.ts`)
- **Paid:** additional paint brand packs (W&N, Williamsburg, Rembrandt, future brands) as one-time IAP purchases; locked brands show an upgrade modal on web pointing to the native app
- **Rationale:** the pigment database is the key differentiator and the natural upgrade path; IAP avoids backend infrastructure and preserves the zero-upload privacy promise; no subscription fatigue
- **Cloud sync / backend: do not build** — it conflicts with the core "runs locally, no uploads" promise and creates ongoing maintenance cost with no clear advantage over the IAP model
- If a paid tier is ever introduced beyond brand packs, prefer a one-time purchase over a subscription

## Known User Pain Points (from market research)

- Paint brand specificity: users want to select exact brand + pigment, not generic approximations
- Fragmented workflow: most users run 3-4 separate apps per session
- Mobile UI feels like a desktop port, not a tablet-native experience
- Bright UIs are disruptive when painting in low light

## Roadmap

### Phase 1 (Web App) — Priority Order

| Priority | Feature | Effort | Type | Monetisation | Status |
|---|---|---|---|---|---|---|
| **P1** | Thumbnail Sketch Overlay | Medium (~400 lines) | New tool | Free | ✅ Done |
| **P2** | Multiple Mix Suggestions | Small (~100 lines) | Enhancement to Paint Mix | Gated (Pro) | ✅ Done |
| **P3** | Cropping / Format Selector (ViewCatcher) | Medium (~300 lines) | New tool | Free | ✅ Done |
| **P4** | Colour Studio | Medium-large | New tool (unified view) | Free | ✅ Done |
| **P5+P6** | UI Overhaul (incl. controls panel collapse) | Medium-large | Design polish (all surfaces + collapse toggle) | — | Planned |
| **P7** | Automated Sketch Generator | Medium | New tool (composite) | Free | ✅ Done |
| **P8** | Gamut Mask | Large (~500+ lines) | New tool | Free + paid pigment overlay | Planned |

---

#### P3 — Cropping / Format Selector (ViewCatcher)

| Field | Detail |
|---|---|
| **Why** | The first thing painters do with a reference is decide what to include. Paired with the Composition tool (rule of thirds / phi grid), this forms a complete composition workflow. High workflow gap. |
| **What** | An overlay for trying out aspect ratios before committing to a panel size. Presets: square (1:1), standard (3:4, 4:5, 5:7, 8:10), landscape (16:9, 2:1, 3:2), panoramic (3:1). Drag the crop window to recompose. Dimmed outside area like a physical viewfinder. "Save crop region as new working image" button (like Use as source). |
| **Effort** | ~300 lines. Canvas overlay layer with drag handles at corners/edges. Aspect ratio constraints lock width/height proportionally. Dimmed area via composited canvas draw or `mix-blend-mode`. |
| **Monetisation** | Free tier. |

#### P4 — Colour Studio ✅

| Field | Detail |
|---|---|
| **Why** | Palette extraction, paint mixing, and colour harmonies are three separate tools that all deal with colour analysis. A unified view lets artists see extracted palette swatches alongside their paint matches and harmony schemes without switching tools. Directly requested by user feedback. |
| **What** | Combines the Palette (K-means swatches), Paint Mix (closest pigments per swatch), and Harmonies (harmonic schemes) into a single tool view. Click any extracted palette swatch → see closest paints + harmonies for that colour. Streamlined — shows what's relevant without the overhead of three separate tools. |
| **Effort** | ~450 lines (component + CSS). Reuses K-means worker, pigment database, and harmony engine. No new pixel math. |
| **Monetisation** | Free tier. |

#### P5+P6 — UI Overhaul (incl. Controls Panel Collapse)

| Field | Detail |
|---|---|
| **Why** | The app uses design tokens and follows a consistent dark theme, but surfaces could use more polish — refined spacing, subtle micro-interactions, richer hover states, tighter component design. The fixed 220px sidebar also has no hide toggle, which is especially needed on narrow viewports. Folding the collapse toggle into the overhaul avoids redoing the panel layout twice. |
| **What** | A pass over every surface: header, toolbar, controls panel, canvas area, modals, action menus. Review typography hierarchy, button styles, card/panel padding, colour contrast, transition animations, and focus states. Includes a collapse toggle for the controls panel (icon + animation). May involve a design tokens audit. |
| **Effort** | Medium-large. Mostly CSS and component refactoring — no new functionality. Can be broken into sub-tasks per surface. |
| **Monetisation** | — |

#### P7 — Automated Sketch Generator ✅

| Field | Detail |
|---|---|
| **Why** | Nice-to-have: a single tool that composites an edge-detection line drawing over simplified colour planes, producing a result that looks more like a hand-drawn sketch than any single existing tool. |
| **What** | Combines the existing Shape Simplify (blur + posterize → flat colour background) and Edges (Sobel linework on top) into one rendered output. Controls for colour blur radius, posterisation levels, edge blur, edge strength, edge opacity, and line colour (white/black). |
| **Effort** | ~250 lines (processing pipeline + component + CSS). Reuses box blur and Sobel algorithms in a single composite pipeline. |
| **Monetisation** | Free tier. |

#### P8 — Gamut Mask

| Field | Detail |
|---|---|
| **Why** | Niche but passionate audience (colour-theory crowd). Would generate word-of-mouth. Deepens the colour-science credibility of the app. |
| **What** | Shows the colour gamut of the loaded image on a CIE chromaticity diagram or simplified colour wheel. Reveals colour strategy: limited palette vs. full colour, dominant temperature, which hue families are present. Optionally overlays pigment coverage from the database. |
| **Effort** | Large (~500+ lines). Heavy pixel work — sample every Nth pixel, convert to CIE L*u*v* or xyY, plot on a 2D diagram canvas. Run in a Web Worker. Pigment overlay reuses existing LAB distance calculation. |
| **Monetisation** | Gamut visualisation free tier. Pigment overlays on the gamut diagram could be a paid feature. May be deferred to Phase 2 if the colour-science audience doesn't materialise on web. |

---

### Phase 2 (Native Tablet App) — Features Reserved for Native

These features require the tablet-native interaction model and are deferred until the native app build begins.

| Feature | Rationale |
|---|---|
| **Multi-layered painting process** | A step-by-step tool for planning layered paintings (e.g., underpainting → block-in → refinement). Too complex for web — needs proper layer management, timeline, and tablet-native gesture interactions. The core product would shift from "reference study" toward "painting companion," which is best executed as a native app. |
| **Gamut Mask** (if deferred) | If the colour-science audience proves strong on web, the Gamut Mask can be enhanced for native with richer visualisation and pigment-database overlays as an IAP. |
| **Any feature requiring heavy local storage, background processing, or tight OS integration** | File system access, Apple Pencil Scribble integration, Metal-accelerated image processing, etc. |

---

### Monetisation Strategy (Updated)

**Current model (unchanged):**
- Free tier: full access to all tools; pigment database includes Gamblin only
- Paid: additional paint brand packs (W&N, Williamsburg, Rembrandt, etc.) as one-time IAP

**New: feature-level gating**
- Multiple Mix Suggestions (P2) introduces feature gating alongside brand gating
- Free: single best 2-paint mix (current behaviour)
- Paid (Pro): top-5 alternative mixes + 3-paint combinations
- Gating mechanism reuses the existing entitlement infrastructure (`isBrandUnlocked` pattern or a new feature flag in `entitlements.ts`)

**Unlock key script:**
A standalone HTML file is available at `docs/unlock-key.html`. Share it with colleagues and friends — they open it in their browser, click a button, and get all Pro features + brand packs unlocked via localStorage. Same mechanism as the DevTools console; no backend involved.

**Philosophy:**
- The web app remains a generous free tier / audience-builder for the native app
- Premium features on web are a taste of what the native app offers
- The native app is the primary revenue vehicle (brand pack IAP + enhanced Pro features)
