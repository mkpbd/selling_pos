// Public API of the products module.
export { categoriesApi, categoryKeys, productKeys, productsApi, unitKeys, unitsApi } from './api/products.api'
export { useCategories, useUnits } from './hooks/useCatalog'
export { useProduct, useProductList } from './hooks/useProducts'
export { productsRoutes } from './routes'
export type { Category, Product, ProductInput, Unit } from './types'
