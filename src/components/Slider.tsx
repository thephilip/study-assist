import styles from './Slider.module.css'

type Props = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}

export function Slider({ label, value, min, max, step = 1, onChange }: Props) {
  const id = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <label htmlFor={id} className={styles.label}>{label}</label>
        <span className={styles.value}>{value}</span>
      </div>
      <input
        id={id}
        type="range"
        className={styles.input}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  )
}
