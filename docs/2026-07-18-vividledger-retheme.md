# Retheme study-assist to the VividLedger look

Plan only — agreed 2026-07-18 to discuss before doing any of it. Source of the look:
`~/Downloads/_project/vividledger.art/frontend/src/styles.css` (203-line flat sheet;
brand register in that repo's `PRODUCT.md`).

## Approach

Study-assist's token system (`src/tokens/index.css`) is more mature than VividLedger's
flat stylesheet — full spacing/type scales, overlay/backdrop/shadow/easing tokens, CSS
modules. So **keep this repo's architecture and pour VividLedger's values into it**, not
a port of `styles.css`. Nearly all work lands in one file.

## 1. Token value swaps (`src/tokens/index.css`)

| Token | Current | VividLedger |
|---|---|---|
| `--color-bg` | `#0e0e0f` | `#0B0B0F` |
| `--color-surface` | `#161618` | `#16161E` |
| `--color-surface-2` | `#1e1e21` | `#1C1C26` |
| `--color-surface-3` | `#26262a` | keep or `#22222E` (VL has only 2 surfaces; derive) |
| `--color-border` | `#2e2e33` | `#262631` |
| `--color-text` | `#e8e8ec` | `#F9F9FB` |
| `--color-text-muted` | `#8a8a96` | `#9B9BAB` |
| `--color-text-faint` | `#56565e` | `#8A8A9E` (VL's faint is lighter; check contrast in situ) |
| `--color-accent` | `#7c6af7` | `#6366F1` |
| `--color-accent-hover` | `#9285f9` | `#818CF8` |
| `--color-accent-subtle` | `rgba(124,106,247,.08)` | `rgba(99,102,241,.12)` |
| `--color-ok` | `#4caf82` | `#34D399` |
| `--color-warn` | `#d4873a` | `#FBBF24` |

Backdrop/overlay rgba tokens: rebase on the new `#0B0B0F` bg. Danger has no VL
equivalent — keep `#e05555`.

**Radius**: VividLedger uses a single tight `5px` everywhere. Study-assist's scale is
4/8/12/16. Decision for discussion: either set `--radius-md: 5px` (and audit lg/xl
usages), or accept the tighter feel only where it matters (buttons, inputs, cards).

## 2. Signature details to port (a few lines each)

- **Eyebrow label**: `font-size:11px; font-weight:600; letter-spacing:.18em;
  text-transform:uppercase; color:var(--color-text-faint)` — VL uses it above every
  page title and section head. Add as a utility class or component.
- **Sticky blurred header**: `position:sticky; backdrop-filter:blur(12px);
  background:rgba(11,11,15,.85); border-bottom:1px solid var(--color-border)`.
- **Headings**: `letter-spacing:-.02em`, weight 700; page titles
  `clamp(24px,4vw,34px)`.
- **Selection**: `::selection{background:var(--color-accent);color:#fff}`.
- **Numbers**: `font-variant-numeric:tabular-nums` wherever digits align (timers,
  scores).
- **Focus**: `:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px}`
  (study-assist already has a focus style — keep whichever is stronger).
- **Logo mark** (optional): bordered square with offset accent fill, pure CSS ~8 lines,
  recolors via the accent token:
  ```css
  .logo-mark{width:22px;height:22px;border:1.5px solid var(--color-accent);border-radius:4px;position:relative}
  .logo-mark::after{content:"";position:absolute;inset:4px 4px 4px 10px;background:var(--color-accent);border-radius:1px}
  ```

## 3. Not part of this

- No CSS-module restructuring, no component changes beyond class additions.
- PWA manifest `theme_color`/`background_color` should follow the new bg — one-line
  follow-up, remember the installed-app titlebar uses it.
- VividLedger's layout (shell width 1280, 60px header) only if wanted; the retheme is
  colors + type details first.

## Estimate

30–60 min, almost entirely in `src/tokens/index.css`. Verify by eye against a running
VividLedger (`./dev.sh` in that repo) side by side.
