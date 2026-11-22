import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoryKeys, productKeys, productsApi, unitKeys } from '../api/products.api'
import type { ProductInput, ProductListParams } from '../types'

export function useProductList(params: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: ({ signal }) => productsApi.list(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ''),
    queryFn: ({ signal }) => productsApi.get(id as string, signal),
    enabled: Boolean(id),
  })
}

function useInvalidateAfterProductSave() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: productKeys.all })
    // products_count on categories/units, and stock lists (track_stock / is_active / cost) may change.
    void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    void queryClient.invalidateQueries({ queryKey: unitKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['inventory'] })
  }
}

export function useCreateProduct() {
  const invalidate = useInvalidateAfterProductSave()
  return useMutation({ mutationFn: (input: ProductInput) => productsApi.create(input), onSuccess: invalidate })
}

export function useUpdateProduct() {
  const invalidate = useInvalidateAfterProductSave()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductInput }) => productsApi.update(id, input),
    onSuccess: (product) => {
      queryClient.setQueryData(productKeys.detail(product.id), product)
      invalidate()
    },
  })
}
