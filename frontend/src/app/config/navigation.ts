import {
  BadgeDollarSign,
  Building2,
  ChartColumn,
  Contact,
  LayoutDashboard,
  Package,
  ScanBarcode,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import { PERMISSIONS, type Permission } from '@/shared/constants/permissions'

export interface NavItem {
  title: string
  icon: LucideIcon
  /** Omit for upcoming modules (rendered disabled with a "Soon" badge). */
  to?: string
  permission?: Permission
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [{ title: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW }],
  },
  {
    label: 'Catalog & stock',
    items: [
      { title: 'Products', to: '/products', icon: Package, permission: PERMISSIONS.PRODUCTS_VIEW },
      { title: 'Inventory', to: '/inventory', icon: Warehouse, permission: PERMISSIONS.INVENTORY_VIEW },
    ],
  },
  {
    label: 'Operations',
    items: [
      { title: 'Sales / POS', icon: ScanBarcode },
      { title: 'Customers', icon: Contact },
      { title: 'Purchases', icon: Truck },
      { title: 'Finance', icon: BadgeDollarSign },
      { title: 'Reports', icon: ChartColumn },
    ],
  },
  {
    label: 'Administration',
    items: [
      { title: 'Branches', to: '/branches', icon: Building2, permission: PERMISSIONS.BRANCHES_VIEW },
      { title: 'Users', to: '/users', icon: Users, permission: PERMISSIONS.USERS_VIEW },
      { title: 'Roles & permissions', to: '/roles', icon: ShieldCheck, permission: PERMISSIONS.ROLES_VIEW },
    ],
  },
]

/** Keeps items the user may see; drops empty sections. */
export function filterNavigation(sections: NavSection[], can: (permission: Permission) => boolean): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || can(item.permission)),
    }))
    .filter((section) => section.items.length > 0)
}
