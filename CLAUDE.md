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

## Core Features — Build Status

| Feature | Status | Notes |
|---|---|---|
| Value map | ✅ done | BT.601 luma + N-level posterization |
| Notan | ✅ done | Luma threshold → pure black/white |
| Color picker | ✅ done | Circular region sampling; hover preview, click to lock; copies hex |
| Shape simplification | ✅ done | Separable box blur (O(w×h)) + posterize |
| Grid overlay | ✅ done | Preset buttons, col/row sliders, opacity, white/black toggle |
| Color palette extraction | ✅ done | K-means++ in a Web Worker; proportional swatch bar |
| Temperature map | ✅ done | Per-pixel HSL hue → warm/cool overlay |
| Paint mixing guidance | ✅ done | LAB math + pigment database (key differentiator) |
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
| Changelog modal | 🗓 planned | Show release notes on update; entries tagged `public`/`hidden` — hidden entries (e.g. new premium brand packs) render as "Bug fixes and improvements" to avoid leaking the premium roadmap |

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
