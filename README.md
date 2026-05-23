# study assist

A painting reference tool for artists — a web-first alternative to colorstudy.app, built with a clean, accessible, dark-mode-first UI.

Process reference photos entirely in your browser. No uploads, no accounts, no server — everything runs locally on your device.

---

## Features

| Tool | Description |
|---|---|
| **Value Map** | Posterizes to N tonal levels to reveal value structure |
| **Notan** | Reduces to pure black and white to study shape and silhouette |
| **Color Picker** | Hover to preview, click to lock; samples a region average; copies hex |
| **Shape Simplify** | Box blur + posterize to simplify complex edges into readable shapes |
| **Grid Overlay** | Configurable grid with presets, opacity, and colour controls |
| **Palette Extraction** | K-means++ colour clustering with a proportional swatch bar |
| **Temperature Map** | Maps hue to warm/cool overlay while preserving luminance |
| **Paint Mix** | Matches sampled colours to paints from Gamblin, W&N, Williamsburg, and Rembrandt; suggests a 2-paint mix with ratios |

---

## Getting started

```bash
# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173), drop in a reference photo, and start studying.

```bash
# Production build
pnpm build
```

---

## Tech stack

- **Vite + React 19 + TypeScript** (strict)
- **CSS Modules** with CSS custom properties design tokens
- **Canvas API** + `getImageData` pixel manipulation — no image processing libraries
- **Web Workers** for heavy algorithms (K-means palette extraction)
- **No backend** — everything runs client-side

---

## Project structure

```
src/
  components/       # Panel, Slider, ImageDrop
  hooks/            # useImage, useProcessedCanvas
  lib/
    canvas.ts       # getPixelData, mapPixels, drawImageToCanvas
    color.ts        # RGB ↔ HSL ↔ LAB ↔ CMYK, deltaE
    pigments/       # Paint brand database + LAB matching
  tokens/
    index.css       # Design tokens (colour, type, spacing, radii)
  tools/            # One .ts (logic) + .tsx (component) per tool
  workers/
    kmeans.worker.ts
```

---

## Roadmap

- [ ] Touch support for tablet browsers (iPad home screen via PWA)
- [ ] Native tablet app — iOS + Android (Flutter, post web release)
- [ ] Spectral-measured pigment data for improved mix accuracy

---

## License

MIT — see [LICENSE](LICENSE)
