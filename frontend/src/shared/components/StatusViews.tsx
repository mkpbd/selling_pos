import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import { ArrowLeft, Compass, House, ShieldX } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'

interface StatusViewProps {
  code: string
  title: string
  description: string
  icon: ReactNode
}

function StatusView({ code, title, description, icon }: StatusViewProps) {
  useDocumentTitle(title)
  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      <div aria-hidden="true" className="bg-dot-pattern absolute inset-0 text-foreground/40 [mask-image:radial-gradient(closest-side,black,transparent)]" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center"
      >
        <span className="text-gradient-brand text-7xl font-extrabold tracking-tighter sm:text-8xl">{code}</span>
        <div className="mt-4 flex size-12 items-center justify-center rounded-2xl border bg-card text-primary shadow-sm">
          {icon}
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft data-icon="inline-start" />
            Go back
          </Button>
          <Button asChild>
            <Link to="/dashboard">
              <House data-icon="inline-start" />
              Dashboard
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  )
}

export function NotFoundView() {
  return (
    <StatusView
      code="404"
      title="Page not found"
      description="The page you're looking for doesn't exist or has moved."
      icon={<Compass className="size-6" aria-hidden="true" />}
    />
  )
}

export function ForbiddenView() {
  return (
    <StatusView
      code="403"
      title="Access denied"
      description="You don't have permission to view this page in the current branch. Try switching branches or ask an administrator for access."
      icon={<ShieldX className="size-6" aria-hidden="true" />}
    />
  )
}
