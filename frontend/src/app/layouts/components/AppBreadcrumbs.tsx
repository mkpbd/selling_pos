import { Fragment } from 'react'
import { Link, useMatches } from 'react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb'

export interface RouteHandle {
  crumb?: string
}

function isRouteHandle(handle: unknown): handle is RouteHandle {
  return typeof handle === 'object' && handle !== null && typeof (handle as RouteHandle).crumb === 'string'
}

/** Builds breadcrumbs from `handle.crumb` on matched routes. */
export function AppBreadcrumbs() {
  const matches = useMatches()
  const crumbs = matches
    .filter((m) => isRouteHandle(m.handle))
    .map((m) => ({ id: m.id, label: (m.handle as RouteHandle).crumb as string, to: m.pathname }))
  // Dedupe consecutive identical labels (index routes inherit the parent pathname).
  const unique = crumbs.filter((c, i) => i === 0 || crumbs[i - 1]?.label !== c.label)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:inline-flex">
          <BreadcrumbLink asChild>
            <Link to="/dashboard">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {unique.map((crumb, i) => {
          const last = i === unique.length - 1
          return (
            <Fragment key={crumb.id}>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                {last ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.to}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
