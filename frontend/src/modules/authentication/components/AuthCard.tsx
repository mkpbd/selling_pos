import type { ReactNode } from 'react'
import { motion } from 'motion/react'

interface AuthCardProps {
  title: string
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

/** Heading + content block used by every auth page inside the split layout. */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
      aria-labelledby="auth-title"
    >
      <div className="mb-8 space-y-2">
        <h1 id="auth-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
      {footer && <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>}
    </motion.section>
  )
}
