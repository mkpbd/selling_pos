import { useMemo } from 'react'
import { NavLink, useLocation } from 'react-router'
import { filterNavigation, NAV_SECTIONS } from '@/app/config/navigation'
import { env } from '@/app/config/env'
import { usePermission } from '@/modules/authentication'
import { BrandMark } from '@/shared/components/BrandMark'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/shared/components/ui/sidebar'

export function AppSidebar() {
  const { can } = usePermission()
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  const sections = useMemo(() => filterNavigation(NAV_SECTIONS, can), [can])

  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon" variant="inset" aria-label="Main navigation">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={env.appName}>
              <NavLink to="/dashboard" onClick={closeOnMobile}>
                <BrandMark size={32} />
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-bold tracking-tight">{env.appName}</span>
                  <span className="truncate text-xs text-muted-foreground">Retail operations</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon
                  if (!item.to) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          disabled
                          aria-disabled="true"
                          tooltip={`${item.title} (coming soon)`}
                          className="opacity-60"
                        >
                          <Icon aria-hidden="true" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                        <SidebarMenuBadge className="text-[0.65rem] text-muted-foreground">Soon</SidebarMenuBadge>
                      </SidebarMenuItem>
                    )
                  }
                  const active = pathname === item.to || pathname.startsWith(`${item.to}/`)
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <NavLink to={item.to} onClick={closeOnMobile} aria-current={active ? 'page' : undefined}>
                          <Icon aria-hidden="true" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 pb-1 text-[0.7rem] text-muted-foreground group-data-[collapsible=icon]:hidden">
          v0.1 · Foundation
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
