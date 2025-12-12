import type { ReactNode } from 'react'
import classes from './Card.module.css'

export interface CardProps {
  title?: string
  children: ReactNode
  className?: string
}

export function Card({ title, children, className }: CardProps) {
  return (
    <div className={`${classes.card} ${className || ''}`}>
      {title && <h3 className={classes.title}>{title}</h3>}
      {children}
    </div>
  )
}
