import { motion } from 'motion/react'
import { Building2, Clock, Crown, ShieldCheck } from 'lucide-react'
import type { Me } from '@/modules/authentication'
import { Badge } from '@/shared/components/ui/badge'
import { formatRelative } from '@/shared/utils/format'

function greeting(date = new Date()): string {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function WelcomeHero({ user }: { user: Me }) {
  const firstName = user.name.split(/\s+/)[0] ?? user.name
  const today = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="bg-brand-gradient relative overflow-hidden rounded-2xl p-6 text-white shadow-lg sm:p-8"
      aria-labelledby="welcome-title"
    >
      {/* decorative pattern */}
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-[0.12]" preserveAspectRatio="none">
        <defs>
          <pattern id="hero-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="white" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 200 200" className="absolute -top-16 -right-16 size-72 opacity-25">
        <circle cx="100" cy="100" r="80" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="100" cy="100" r="55" fill="none" stroke="white" strokeWidth="1" />
        <circle cx="100" cy="100" r="28" fill="white" fillOpacity="0.25" />
      </svg>

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-white/70">{today}</p>
          <h1 id="welcome-title" className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-2 text-sm text-white/80">
            {user.current_branch
              ? `You're working in ${user.current_branch.name}. Everything you see is scoped to this branch.`
              : 'No branch is assigned to your account yet. Ask an administrator to assign one.'}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm sm:flex sm:flex-wrap">
          <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur-sm">
            <dt className="flex items-center gap-1.5 text-xs text-white/70">
              <Building2 className="size-3.5" aria-hidden="true" /> Branch
            </dt>
            <dd className="mt-0.5 font-semibold">{user.current_branch?.code ?? '—'}</dd>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur-sm">
            <dt className="flex items-center gap-1.5 text-xs text-white/70">
              <ShieldCheck className="size-3.5" aria-hidden="true" /> Role
            </dt>
            <dd className="mt-0.5 flex flex-wrap gap-1 font-semibold">
              {user.is_super_admin ? (
                <Badge className="gap-1 bg-amber-400/90 text-amber-950">
                  <Crown className="size-3" aria-hidden="true" /> Super admin
                </Badge>
              ) : user.roles.length ? (
                user.roles.join(', ')
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div className="col-span-2 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur-sm sm:col-span-1">
            <dt className="flex items-center gap-1.5 text-xs text-white/70">
              <Clock className="size-3.5" aria-hidden="true" /> Previous sign-in
            </dt>
            <dd className="mt-0.5 font-semibold">{formatRelative(user.last_login_at, 'First time here')}</dd>
          </div>
        </dl>
      </div>
    </motion.section>
  )
}
