/** `Role` resource (contract §6). Role ids are numeric. */
export interface Role {
  id: number
  name: string
  is_system: boolean
  permissions: string[]
  users_count: number
  created_at: string
  updated_at: string
}

export interface RoleInput {
  name: string
  permissions: string[]
}

export interface PermissionItem {
  name: string
  label: string
}

/** `GET /permissions` item. */
export interface PermissionGroup {
  group: string
  permissions: PermissionItem[]
}
