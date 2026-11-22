// Public API of the inventory module.
export { inventoryApi, inventoryKeys } from './api/inventory.api'
export { StockSummaryCards, type SummaryMetric } from './components/StockSummaryCards'
export { useStockSummary } from './hooks/useInventory'
export { inventoryRoutes } from './routes'
export type { Movement, StockItem, StockStatus, StockSummary } from './types'
