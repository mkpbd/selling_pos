import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { branchesApi, branchKeys } from '../api/branches.api'
import type { BranchInput, BranchListParams } from '../types'

export function useBranchList(params: BranchListParams) {
  return useQuery({
    queryKey: branchKeys.list(params),
    queryFn: ({ signal }) => branchesApi.list(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useBranch(id: string | undefined) {
  return useQuery({
    queryKey: branchKeys.detail(id ?? ''),
    queryFn: ({ signal }) => branchesApi.get(id as string, signal),
    enabled: Boolean(id),
  })
}

export function useCreateBranch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BranchInput) => branchesApi.create(input),
    onSuccess: (branch) => {
      queryClient.setQueryData(branchKeys.detail(branch.id), branch)
      void queryClient.invalidateQueries({ queryKey: branchKeys.lists() })
    },
  })
}

export function useUpdateBranch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BranchInput }) => branchesApi.update(id, input),
    onSuccess: (branch) => {
      queryClient.setQueryData(branchKeys.detail(branch.id), branch)
      void queryClient.invalidateQueries({ queryKey: branchKeys.lists() })
      // Branch names appear in `me.branches` (branch switcher).
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}
