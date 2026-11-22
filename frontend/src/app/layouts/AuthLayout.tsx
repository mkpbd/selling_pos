import { motion } from 'motion/react'
import { Outlet } from 'react-router'
import { Boxes, Building2, ShieldCheck, Zap } from 'lucide-react'
import { env } from '@/app/config/env'
import { BrandLogo } from '@/shared/components/BrandMark'
import { ThemeToggle } from './components/ThemeToggle'

const FEATURES = [
  { icon: Zap, title: 'Fast checkout', text: 'Built for busy counters and barcode scanners.' },
  { icon: Building2, title: 'Multi-branch', text: 'One account, every store, role-based per branch.' },
  { icon: ShieldCheck, title: 'Secure by default', text: 'Granular permissions and audited access.' },
  { icon: Boxes, title: 'Stock in sync', text: 'Inventory that follows every sale.' },
]

/** Original POS illustration: terminal with screen, receipt and card. */
function PosIllustration() {
  return (
    <svg viewBox="0 0 360 260" className="h-auto w-full max-w-sm" aria-hidden="true">
      <defs>
        <linearGradient id="pos-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#e0e7ff" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="pos-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.45 0.2 277)" />
          <stop offset="1" stopColor="oklch(0.35 0.16 290)" />
        </linearGradient>
        <linearGradient id="pos-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.78 0.15 165)" />
          <stop offset="1" stopColor="oklch(0.62 0.15 175)" />
        </linearGradient>
      </defs>
      {/* glow */}
      <ellipse cx="180" cy="238" rx="140" ry="12" fill="#000" opacity="0.18" />
      {/* receipt */}
      <g transform="translate(232 28) rotate(8)">
        <path
          d="M0 0h78v150l-9.75-8-9.75 8-9.75-8-9.75 8-9.75-8-9.75 8-9.75-8L0 150z"
          fill="#fff"
          opacity="0.96"
        />
        <rect x="12" y="16" width="40" height="6" rx="3" fill="oklch(0.5 0.2 277)" opacity="0.7" />
        {[36, 50, 64, 78].map((y) => (
          <g key={y}>
            <rect x="12" y={y} width="34" height="4" rx="2" fill="#c7d2fe" />
            <rect x="52" y={y} width="14" height="4" rx="2" fill="#c7d2fe" />
          </g>
        ))}
        <rect x="12" y="98" width="54" height="1.5" fill="#c7d2fe" />
        <rect x="12" y="108" width="24" height="6" rx="3" fill="oklch(0.6 0.15 165)" />
        <rect x="44" y="108" width="22" height="6" rx="3" fill="oklch(0.6 0.15 165)" />
      </g>
      {/* terminal */}
      <g transform="translate(60 40)">
        <rect x="40" y="150" width="120" height="40" rx="10" fill="url(#pos-body)" />
        <rect x="88" y="120" width="24" height="36" fill="url(#pos-body)" />
        <rect x="0" y="0" width="200" height="130" rx="14" fill="url(#pos-body)" />
        <rect x="10" y="10" width="180" height="110" rx="8" fill="url(#pos-screen)" />
        <rect x="22" y="24" width="70" height="8" rx="4" fill="#fff" opacity="0.85" />
        <rect x="22" y="40" width="46" height="5" rx="2.5" fill="#fff" opacity="0.45" />
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => (
            <rect
              key={`${r}-${c}`}
              x={22 + c * 26}
              y={56 + r * 18}
              width="20"
              height="12"
              rx="3"
              fill="#fff"
              opacity={r === 2 && c === 2 ? 0.9 : 0.22}
            />
          )),
        )}
        <rect x="110" y="56" width="68" height="48" rx="6" fill="#fff" opacity="0.12" />
        <path d="M118 94l12-14 10 8 14-18 14 10" fill="none" stroke="oklch(0.82 0.14 165)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="168" cy="80" r="3.5" fill="oklch(0.82 0.14 165)" />
      </g>
      {/* card */}
      <g transform="translate(20 150) rotate(-12)">
        <rect width="96" height="60" rx="9" fill="url(#pos-card)" />
        <rect x="10" y="14" width="18" height="13" rx="3" fill="#fff" opacity="0.75" />
        <rect x="10" y="38" width="50" height="5" rx="2.5" fill="#fff" opacity="0.6" />
        <circle cx="74" cy="44" r="8" fill="#fff" opacity="0.45" />
        <circle cx="82" cy="44" r="8" fill="#fff" opacity="0.3" />
      </g>
    </svg>
  )
}

export function AuthLayout() {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="bg-brand-gradient relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col">
        <div aria-hidden="true" className="bg-dot-pattern absolute inset-0 text-white/40 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div aria-hidden="true" className="absolute -bottom-32 -left-24 size-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div aria-hidden="true" className="absolute -top-24 right-0 size-80 rounded-full bg-fuchsia-400/20 blur-3xl" />

        <BrandLogo name={env.appName} tagline="Enterprise point of sale" inverted className="relative" />

        <div className="relative flex flex-1 flex-col items-center justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm"
          >
            <PosIllustration />
          </motion.div>
          <h2 className="mt-8 max-w-md text-center text-3xl font-bold tracking-tight text-balance">
            Run every counter, branch and shift from one place.
          </h2>
        </div>

        <ul className="relative grid grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.35 }}
              className="flex gap-3 rounded-xl bg-white/7 p-3 ring-1 ring-white/10 backdrop-blur-sm"
            >
              <Icon className="mt-0.5 size-5 shrink-0 text-emerald-300" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-white/70">{text}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <BrandLogo name={env.appName} className="lg:invisible" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <Outlet />
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {env.appName}. All rights reserved.
        </p>
      </main>
    </div>
  )
}
