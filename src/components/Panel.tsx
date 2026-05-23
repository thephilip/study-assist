import type { ReactNode } from 'react'
import styles from './Panel.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export function Panel({ children, className }: Props) {
  return (
    <div className={`${styles.panel} ${className ?? ''}`}>
      {children}
    </div>
  )
}
