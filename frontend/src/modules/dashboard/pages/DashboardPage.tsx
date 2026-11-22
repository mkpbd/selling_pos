import { Link } from 'react-router'
import {
  ArrowRight,
  BadgeDollarSign,
  Building2,
  ChartColumn,
  Contact,
  Package,
  ScanBarcode,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import { useAuth, usePermission } from '@/modules/authentication'
import { StockSummaryCards } from '@/modules/inventory'
import { Button } from '@/shared/components/ui/button'
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

const CATALOG_TILES: TileDef[] = [
  {
    title: 'Products',
    description: 'Catalogue, pricing, margins, categories and units.',
    icon: Package,
    accent: 'bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-300',
    to: '/products',
    permission: PERMISSIONS.PRODUCTS_VIEW,
  },
  {
    title: 'Inventory',
    description: 'On-hand stock, adjustments, counts and the movement ledger.',
    icon: Warehouse,
    accent: 'bg-orange-500/10 text-orange-600 ring-orange-500/20 dark:text-orange-300',
    to: '/inventory',
    permission: PERMISSIONS.INVENTORY_VIEW,
  },
]

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

function Section({ id, title, description, action, children }: { id: string; title: string; description: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id={id} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function DashboardPage() {
  useDocumentTitle('Dashboard')
  const { user } = useAuth()
  const { can } = usePermission()
  if (!user) return null

  const visible = (tiles: TileDef[]) => tiles.filter((t) => !t.permission || can(t.permission))
  const catalogTiles = visible(CATALOG_TILES)
  const adminTiles = visible(ADMIN_TILES)
  const canSeeStock = can(PERMISSIONS.INVENTORY_VIEW)

  return (
    <div className="space-y-10">
      <WelcomeHero user={user} />

      {canSeeStock && (
        <Section
          id="stock-heading"
          title="Stock health"
          description={`Live figures for ${user.current_branch?.name ?? 'your branch'}.`}
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/inventory">
                View inventory
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          }
        >
          <StockSummaryCards metrics={['low_stock', 'out_of_stock', 'stock_value']} linkBase="/inventory" />
        </Section>
      )}

      {catalogTiles.length > 0 && (
        <Section id="catalog-heading" title="Catalog & stock" description="Manage what you sell and what you hold.">
          <ul className="grid gap-4 sm:grid-cols-2">
            {catalogTiles.map((tile, i) => (
              <ModuleTile key={tile.title} {...tile} index={i} />
            ))}
          </ul>
        </Section>
      )}

      {adminTiles.length > 0 && (
        <Section id="admin-heading" title="Administration" description="Set up your organisation before you start selling.">
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {adminTiles.map((tile, i) => (
              <ModuleTile key={tile.title} {...tile} index={i} />
            ))}
          </ul>
        </Section>
      )}

      <Section id="upcoming-heading" title="Coming next" description="Modules on the roadmap for Selling POS.">
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {UPCOMING_TILES.map((tile, i) => (
            <ModuleTile key={tile.title} {...tile} index={i} />
          ))}
        </ul>
      </Section>
    </div>
  )
}

export default DashboardPage
