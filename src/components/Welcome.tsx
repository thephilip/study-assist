import { ImageDrop } from './ImageDrop'
import styles from './Welcome.module.css'

const TOOLS = [
  { name: 'Value Map',       desc: 'Posterize to N tonal values to study light and shadow structure.' },
  { name: 'Notan',           desc: 'Reduce to pure black and white shapes for compositional clarity.' },
  { name: 'Color Picker',    desc: 'Sample any point on your reference and copy the hex to clipboard.' },
  { name: 'Shape Simplify',  desc: 'Blur and posterize to isolate big shapes and lose fine detail.' },
  { name: 'Dither',          desc: 'Break tones into graphic patterns using error-diffusion or Bayer matrices.' },
  { name: 'Grid',            desc: 'Overlay a proportional grid to check angles and placement.' },
  { name: 'Composition',     desc: 'Overlay rule-of-thirds, phi grid, diagonals, or golden spiral guides.' },
  { name: 'Sighting',        desc: 'Measure angles, proportions, and alignment with draggable pins and plumb line.' },
  { name: 'Harmonies',       desc: 'Generate and explore five harmonic colour schemes from any base colour.' },
  { name: 'Palette',         desc: 'Extract the dominant colors from your reference using K-means.' },
  { name: 'Temperature',     desc: 'Highlight warm and cool zones mapped across the image.' },
  { name: 'Paint Mix',       desc: 'Match reference colors to your paint brand with a 2-paint mix suggestion.' },
  { name: 'Histogram',       desc: 'Visualize the tonal distribution and spot clipping or low contrast.' },
  { name: 'Edges',           desc: 'Reveal edge types with Sobel detection — find lost and found edges.' },
  { name: 'Sketch',          desc: 'Draw value thumbnails directly over the reference with stylus support.' },
  { name: 'ViewCatcher',     desc: 'Frame your reference with an interactive crop overlay — try aspect ratios, drag to recompose, save as a new image.' },
]

type Props = { onFile: (file: File) => void; error?: string }

export function Welcome({ onFile, error }: Props) {
  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <h2 className={styles.tagline}>Study your reference before you paint.</h2>
        <p className={styles.sub}>
          Drop any photo to analyse it with sixteen tools — all on-device, nothing uploaded.
        </p>
      </div>

      <div className={styles.grid}>
        {TOOLS.map(tool => (
          <div key={tool.name} className={styles.card}>
            <span className={styles.toolName}>{tool.name}</span>
            <span className={styles.toolDesc}>{tool.desc}</span>
          </div>
        ))}
      </div>

      <div className={styles.dropArea}>
        <ImageDrop onFile={onFile} />
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  )
}
