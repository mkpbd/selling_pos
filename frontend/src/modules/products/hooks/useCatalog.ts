import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesApi, categoryKeys, productKeys, unitKeys, unitsApi } from '../api/products.api'
import type { Category, CategoryInput, Unit, UnitInput } from '../types'

/** Categories and units change rarely; cache them for a few minutes. */
const CATALOG_STALE = 5 * 60_000

export function useCategories(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: ({ signal }) => categoriesApi.list(signal),
    staleTime: CATALOG_STALE,
    enabled: options.enabled ?? true,
  })
}

export function useUnits(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: unitKeys.list(),
    queryFn: ({ signal }) => unitsApi.list(signal),
    staleTime: CATALOG_STALE,
    enabled: options.enabled ?? true,
  })
}

export function useSaveCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CategoryInput }) =>
      id ? categoriesApi.update(id, input) : categoriesApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      // Product rows embed the category name.
      void queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (category: Category) => categoriesApi.remove(category.id),
    onSuccess: (_d, category) => {
      queryClient.setQueryData<Category[]>(categoryKeys.list(), (old) => old?.filter((c) => c.id !== category.id))
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

export function useSaveUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: UnitInput }) => (id ? unitsApi.update(id, input) : unitsApi.create(input)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: unitKeys.all })
      void queryClient.invalidateQueries({ queryKey: productKeys.all })
      // Unit code / allows_decimal appear on stock rows.
      void queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useDeleteUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (unit: Unit) => unitsApi.remove(unit.id),
    onSuccess: (_d, unit) => {
      queryClient.setQueryData<Unit[]>(unitKeys.list(), (old) => old?.filter((u) => u.id !== unit.id))
      void queryClient.invalidateQueries({ queryKey: unitKeys.all })
    },
  })
}
