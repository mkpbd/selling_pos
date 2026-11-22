import { motion } from 'motion/react'
import { Link } from 'react-router'
import { ArrowUpRight, type LucideIcon } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/utils/cn'

export interface ModuleTileProps {
  title: string
  description: string
  icon: LucideIcon
  /** Tailwind classes for the icon chip. */
  accent: string
  to?: string
  index?: number
}

/** Dashboard tile: a live link when `to` is set, otherwise a "coming soon" card. */
export function ModuleTile({ title, description, icon: Icon, accent, to, index = 0 }: ModuleTileProps) {
  const comingSoon = !to
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={cn('flex size-11 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-110', accent)}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {comingSoon ? (
          <Badge variant="secondary" className="text-[0.7rem]">
            Coming soon
          </Badge>
        ) : (
          <ArrowUpRight
            className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
            aria-hidden="true"
          />
        )}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </>
  )

  const className = cn(
    'group relative block h-full rounded-xl border bg-card p-5 shadow-xs transition-all',
    comingSoon
      ? 'border-dashed'
      : 'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
  )

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.04, duration: 0.3, ease: 'easeOut' }}
      className="list-none"
    >
      {to ? (
        <Link to={to} className={className}>
          {body}
        </Link>
      ) : (
        <div className={className} aria-label={`${title}: coming soon`}>
          {body}
        </div>
      )}
    </motion.li>
  )
}
