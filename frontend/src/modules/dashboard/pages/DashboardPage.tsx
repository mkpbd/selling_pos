import {
  BadgeDollarSign,
  Boxes,
  Building2,
  ChartColumn,
  Contact,
  Package,
  ScanBarcode,
  ShieldCheck,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useAuth, usePermission } from '@/modules/authentication'
import { PERMISSIONS, type Permission } from '@/shared/constants/permissions'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { ModuleTile } from '../components/ModuleTile'
import { WelcomeHero } from '../components/WelcomeHero'

interface TileDef {
  title: string
  description: string
  icon: LucideIcon
  accent: string
  to?: string
  permission?: Permission
}

const ADMIN_TILES: TileDef[] = [
  {
    title: 'Branches',
    description: 'Manage stores, warehouses and offices.',
    icon: Building2,
    accent: 'bg-indigo-500/10 text-indigo-600 ring-indigo-500/20 dark:text-indigo-300',
    to: '/branches',
    permission: PERMISSIONS.BRANCHES_VIEW,
  },
  {
    title: 'Users',
    description: 'Invite staff and assign roles per branch.',
    icon: Users,
    accent: 'bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-300',
    to: '/users',
    permission: PERMISSIONS.USERS_VIEW,
  },
  {
    title: 'Roles & permissions',
    description: 'Control exactly who can do what.',
    icon: ShieldCheck,
    accent: 'bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-300',
    to: '/roles',
    permission: PERMISSIONS.ROLES_VIEW,
  },
]

const UPCOMING_TILES: TileDef[] = [
  {
    title: 'Sales / POS',
    description: 'Fast checkout, barcode scanning, receipts and shifts.',
    icon: ScanBarcode,
    accent: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-300',
  },
  {
    title: 'Products',
    description: 'Catalogue, variants, pricing and barcodes.',
    icon: Package,
    accent: 'bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-300',
  },
  {
    title: 'Inventory',
    description: 'Stock levels, transfers and adjustments per branch.',
    icon: Boxes,
    accent: 'bg-orange-500/10 text-orange-600 ring-orange-500/20 dark:text-orange-300',
  },
  {
    title: 'Customers',
    description: 'Profiles, loyalty and purchase history.',
    icon: Contact,
    accent: 'bg-pink-500/10 text-pink-600 ring-pink-500/20 dark:text-pink-300',
  },
  {
    title: 'Purchases',
    description: 'Suppliers, purchase orders and goods received.',
    icon: Truck,
    accent: 'bg-cyan-500/10 text-cyan-600 ring-cyan-500/20 dark:text-cyan-300',
  },
  {
    title: 'Finance',
    description: 'Payments, expenses and cash management.',
    icon: BadgeDollarSign,
    accent: 'bg-lime-500/10 text-lime-700 ring-lime-500/20 dark:text-lime-300',
  },
  {
    title: 'Reports',
    description: 'Sales, stock and performance analytics.',
    icon: ChartColumn,
    accent: 'bg-fuchsia-500/10 text-fuchsia-600 ring-fuchsia-500/20 dark:text-fuchsia-300',
  },
]

export function DashboardPage() {
  useDocumentTitle('Dashboard')
  const { user } = useAuth()
  const { can } = usePermission()
  if (!user) return null

  const adminTiles = ADMIN_TILES.filter((t) => !t.permission || can(t.permission))

  return (
    <div className="space-y-10">
      <WelcomeHero user={user} />

      {adminTiles.length > 0 && (
        <section aria-labelledby="admin-heading" className="space-y-4">
          <div>
            <h2 id="admin-heading" className="text-lg font-semibold tracking-tight">
              Administration
            </h2>
            <p className="text-sm text-muted-foreground">Set up your organisation before you start selling.</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {adminTiles.map((tile, i) => (
              <ModuleTile key={tile.title} {...tile} index={i} />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="upcoming-heading" className="space-y-4">
        <div>
          <h2 id="upcoming-heading" className="text-lg font-semibold tracking-tight">
            Coming next
          </h2>
          <p className="text-sm text-muted-foreground">Modules on the roadmap for Selling POS.</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {UPCOMING_TILES.map((tile, i) => (
            <ModuleTile key={tile.title} {...tile} index={i + adminTiles.length} />
          ))}
        </ul>
      </section>
    </div>
  )
}

export default DashboardPage
