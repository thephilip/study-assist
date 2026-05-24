# study assist

<p>
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript strict">
  <img src="https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite&logoColor=white" alt="Vite 8">
  <img src="https://img.shields.io/badge/pnpm-package%20manager-f69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm">
  <img src="https://img.shields.io/badge/runs%20100%25%20locally-no%20uploads-4caf82?style=flat-square" alt="Runs locally">
  <img src="https://img.shields.io/badge/license-MIT-8a8a96?style=flat-square" alt="MIT License">
</p>

A painting reference tool for artists — value maps, notan, colour picking, paint mixing, and more in one place, with a clean dark-mode-first UI.

Process reference photos entirely in your browser. No uploads, no accounts, no server — everything runs locally on your device.

---

## Tools

| Tool | Description |
|---|---|
| **Value Map** | Posterizes to N tonal levels to reveal value structure |
| **Notan** | Reduces to pure black and white to study shape and silhouette |
| **Color Picker** | Hover to preview, click to lock; averages a sampled region; copies hex |
| **Shape Simplify** | Box blur + posterize to flatten texture into readable flat shapes |
| **Grid Overlay** | Configurable grid with presets, opacity, and line-colour controls |
| **Palette Extraction** | K-means++ colour clustering with a proportional swatch bar |
| **Temperature Map** | Maps hue to warm/cool overlay while preserving luminance |
| **Paint Mix** | Matches sampled colours to paints from Gamblin, W&N, Williamsburg, and Rembrandt; suggests 2-paint mix ratios |
| **Histogram** | Luma histogram with log/linear scale; min, mean, and max tonal range stats |
| **Edge Detection** | Sobel edge overlay with blur, threshold, and opacity controls |

All tools include a side-by-side compare mode and a Save PNG export.

---

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173), drop in a reference photo, and start studying.

```bash
# Production build
pnpm build
```

---

## Tech stack

- **Vite 8 + React 19 + TypeScript** (strict mode)
- **CSS Modules** + CSS custom properties — design tokens in `src/tokens/index.css`
- **Canvas API** + `getImageData` pixel manipulation — no image processing libraries
- **Web Workers** for heavy algorithms (K-means palette extraction)
- **No backend** — all processing is client-side; no data ever leaves the device

---

## Project structure

```
src/
  components/       # Panel, Slider, ImageDrop, SaveButton
  hooks/            # useImage, useProcessedCanvas, useCompare
  lib/
    canvas.ts       # getPixelData, putPixelData, mapPixels, drawImageToCanvas
    color.ts        # RGB ↔ HSL ↔ LAB ↔ CMYK conversions + deltaE
    pigments/       # Paint brand database + LAB nearest-neighbour matching
  tokens/
    index.css       # All design tokens (colour, type, spacing, radii, shadows)
  tools/            # One .ts (logic) + .tsx (component) per tool
  workers/
    kmeans.worker.ts
```

---

## Roadmap

- [ ] Native tablet app — iOS + Android (Flutter, post web release)
- [ ] Spectral-measured pigment data for improved mix accuracy
- [ ] PWA manifest for iPad home screen install

---

## License

MIT — see [LICENSE](LICENSE)
