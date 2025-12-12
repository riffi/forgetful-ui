import type { ReactNode } from 'react'
import classes from './Section.module.css'

export interface SectionProps {
  title: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
  noPadding?: boolean
  className?: string
}

export function Section({ title, icon, action, children, noPadding, className }: SectionProps) {
  return (
    <div className={`${classes.section} ${className || ''}`}>
      <div className={classes.header}>
        <h2 className={classes.title}>
          {icon && <span className={classes.icon}>{icon}</span>}
          {title}
        </h2>
        {action}
      </div>
      <div className={noPadding ? classes.contentNoPadding : classes.content}>
        {children}
      </div>
    </div>
  )
}
