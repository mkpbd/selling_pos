import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi, userKeys } from '../api/users.api'
import type { UserCreateInput, UserListParams, UserUpdateInput } from '../types'

export function useUserList(params: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: ({ signal }) => usersApi.list(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ''),
    queryFn: ({ signal }) => usersApi.get(id as string, signal),
    enabled: Boolean(id),
  })
}

function useOnUserSaved() {
  const queryClient = useQueryClient()
  return (user: { id: string }) => {
    void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    void queryClient.invalidateQueries({ queryKey: userKeys.detail(user.id) })
    // users_count on branches and roles may change.
    void queryClient.invalidateQueries({ queryKey: ['branches'] })
    void queryClient.invalidateQueries({ queryKey: ['roles'] })
  }
}

export function useCreateUser() {
  const onSaved = useOnUserSaved()
  return useMutation({ mutationFn: (input: UserCreateInput) => usersApi.create(input), onSuccess: onSaved })
}

export function useUpdateUser() {
  const onSaved = useOnUserSaved()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UserUpdateInput }) => usersApi.update(id, input),
    onSuccess: (user) => {
      onSaved(user)
      // Editing yourself changes `me`.
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}
