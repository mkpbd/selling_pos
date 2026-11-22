import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { rolesApi, roleKeys } from '../api/roles.api'
import type { Role, RoleInput } from '../types'

export function useRoles(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: ({ signal }) => rolesApi.list(signal),
    enabled: options.enabled ?? true,
  })
}

/** Permission catalogue changes only with deployments, so cache it for long. */
export function usePermissionGroups(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: roleKeys.permissions(),
    queryFn: ({ signal }) => rolesApi.permissions(signal),
    staleTime: 30 * 60_000,
    enabled: options.enabled ?? true,
  })
}

function useInvalidateRoles() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: roleKeys.all })
    // A role's permissions may change what the current user can do.
    void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
  }
}

export function useCreateRole() {
  const invalidate = useInvalidateRoles()
  return useMutation({ mutationFn: (input: RoleInput) => rolesApi.create(input), onSuccess: invalidate })
}

export function useUpdateRole() {
  const invalidate = useInvalidateRoles()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: RoleInput }) => rolesApi.update(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateRoles()
  return useMutation({
    mutationFn: (role: Role) => rolesApi.remove(role.id),
    onSuccess: (_data, role) => {
      // Optimistically drop it from the cached list before the refetch lands.
      queryClient.setQueryData<Role[]>(roleKeys.list(), (old) => old?.filter((r) => r.id !== role.id))
      invalidate()
    },
  })
}
