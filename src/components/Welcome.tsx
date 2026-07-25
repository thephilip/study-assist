// The landing page has one job: get an image in. Everything else is secondary
// until that happens, so the drop zone is the hero and the tool catalogue sits
// below it — grouped into four families, every name a real button.

import { useEffect } from 'react'
import { ImageDrop } from './ImageDrop'
import { TOOLS, TOOL_GROUPS, TOOL_LABELS, TOOL_DESCRIPTIONS, type Tool } from '@/tools/index'
import styles from './Welcome.module.css'

type Props = {
  onFile: (file: File) => void
  /** Load the bundled sample photo, optionally opening straight into one tool. */
  onSample: (tool?: Tool) => void
  error?: string
}

export function Welcome({ onFile, onSample, error }: Props) {
  // a screenshot already in the clipboard is the fastest reference of all
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find(f => f.type.startsWith('image/'))
      if (file) onFile(file)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [onFile])

  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>The studio</p>
        <h2 className={styles.tagline}>Study your reference before you paint.</h2>
        <p className={styles.sub}>
          A workbench of {TOOLS.length} tools that read a photo the way a painter does —
          value, colour, edges, proportion. Everything runs on your device; nothing is uploaded.
        </p>

        <ImageDrop onFile={onFile} />
        {error && <p className={styles.error}>{error}</p>}

        <p className={styles.sampleLine}>
          No photo handy?{' '}
          <button type="button" className={styles.sampleBtn} onClick={() => onSample()}>
            Start with a sample still life
          </button>
        </p>
      </section>

      <section className={styles.catalogue} aria-labelledby="catalogue-head">
        <h3 className={styles.catalogueHead} id="catalogue-head">What you can do with it</h3>
        <div className={styles.groups}>
          {TOOL_GROUPS.map(group => (
            <div key={group.name} className={styles.group}>
              <h4 className={styles.groupName}>{group.name}</h4>
              <p className={styles.groupPurpose}>{group.purpose}</p>
              <ul className={styles.toolList}>
                {group.tools.map(tool => (
                  <li key={tool}>
                    {/* a click always does something: with no image yet, load the sample */}
                    <button type="button" className={styles.tool} onClick={() => onSample(tool)}>
                      <span className={styles.toolName}>{TOOL_LABELS[tool]}</span>
                      <span className={styles.toolDesc}>{TOOL_DESCRIPTIONS[tool]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
