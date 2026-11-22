import { cn } from '@/shared/utils/cn'

interface BrandMarkProps {
  className?: string
  /** Visual size of the square mark in px. */
  size?: number
}

/**
 * Original Selling POS mark: a shopping bag silhouette over a receipt edge,
 * with an emerald "scan" dot. Pure SVG, so it scales and themes cleanly.
 */
export function BrandMark({ className, size = 36 }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      role="img"
      aria-label="Selling POS logo"
    >
      <defs>
        <linearGradient id="sp-mark-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.58 0.22 277)" />
          <stop offset="1" stopColor="oklch(0.5 0.24 300)" />
        </linearGradient>
        <linearGradient id="sp-mark-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#sp-mark-bg)" />
      <rect width="40" height="20" rx="11" fill="url(#sp-mark-shine)" />
      <path
        d="M11 14.5h18l-1.6 12.2a2.4 2.4 0 0 1-2.4 2.1H15a2.4 2.4 0 0 1-2.4-2.1z"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M15.5 14.5V13a4.5 4.5 0 0 1 9 0v1.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16 21.5h8M16 25h5" stroke="#fff" strokeOpacity="0.75" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="29.5" cy="29.5" r="4.2" fill="oklch(0.78 0.16 162)" stroke="#fff" strokeWidth="1.6" />
    </svg>
  )
}

interface BrandLogoProps {
  className?: string
  name: string
  tagline?: string
  inverted?: boolean
}

export function BrandLogo({ className, name, tagline, inverted = false }: BrandLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <BrandMark />
      <div className="leading-tight">
        <p className={cn('text-base font-bold tracking-tight', inverted ? 'text-white' : 'text-foreground')}>{name}</p>
        {tagline && (
          <p className={cn('text-xs', inverted ? 'text-white/70' : 'text-muted-foreground')}>{tagline}</p>
        )}
      </div>
    </div>
  )
}
