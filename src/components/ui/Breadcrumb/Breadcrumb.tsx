import { Link } from 'react-router-dom'
import { IconChevronRight } from '@tabler/icons-react'
import classes from './Breadcrumb.module.css'

export interface BreadcrumbItem {
  title: string
  href: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className={classes.breadcrumb}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <span key={index} className={classes.item}>
            {isLast ? (
              <span className={classes.current}>{item.title}</span>
            ) : (
              <>
                <Link to={item.href} className={classes.link}>
                  {item.title}
                </Link>
                <IconChevronRight size={14} className={classes.separator} />
              </>
            )}
          </span>
        )
      })}
    </nav>
  )
}
