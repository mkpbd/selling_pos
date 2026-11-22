# Selling POS — API Contract v1 · Products & Inventory

Extends [api-contract.md](api-contract.md). All conventions there apply: envelope, error codes, pagination meta, `X-Branch-Id`, list params (`page`, `per_page`, `search`, `sort` with `-` for descending).

## 0. New conventions

### Money and quantities
- **Money** is sent and returned as a **decimal string** with 2 decimals, e.g. `"1250.50"`. Requests also accept JSON numbers. There are never more than 2 decimals.
- **Quantities** are **decimal strings** with 3 decimals, e.g. `"12.000"`, `"0.250"`. Requests accept numbers or strings with up to 3 decimals. If a product's unit has `allows_decimal: false`, quantities must be whole numbers; a fraction gets 422 on the `quantity` field.
- **Percentages** (`tax_rate`) are decimal strings with 2 decimals, `"0.00"`–`"100.00"`.

### Idempotency (critical writes)
`POST /inventory/adjustments` accepts an `Idempotency-Key: <uuid>` header. The frontend should generate one key per form submission, reuse it when retrying that same submission, and use a new key for the next one.
- Same key with the same payload: the original response is replayed (same status and body) with the `Idempotent-Replayed: true` header.
- Same key with a different payload: `422 IDEMPOTENCY_KEY_REUSED`.
- Same key while the first request is still being processed: `409 IDEMPOTENCY_IN_PROGRESS`.
- Keys are scoped to the user and expire after 24h.

## 1. New permissions

| Group | Permission names |
|---|---|
| products | `products.view`, `products.create`, `products.update`, `catalog.manage` (categories and units) |
| inventory | `inventory.view`, `inventory.adjust` |

System role defaults: `admin` gets everything. `manager` adds `products.view, products.create, products.update, catalog.manage, inventory.view, inventory.adjust`. `cashier` adds `products.view, inventory.view`.

## 2. Units — `/api/v1/units`

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/units` | `products.view` | not paginated; sorted by code |
| POST | `/units` | `catalog.manage` | → 201 `Unit` |
| PUT | `/units/{id}` | `catalog.manage` | → `Unit` |
| DELETE | `/units/{id}` | `catalog.manage` | 409 `UNIT_IN_USE` if any product uses it |

`UnitInput`: `{ code: string (1–10 chars, A-Z0-9, unique, stored uppercase), name: string ≤50, allows_decimal: bool }` → 409 `UNIT_CODE_TAKEN` (details.code)
`Unit`: `{ id: uuid, code: "PCS", name: "Piece", allows_decimal: false, products_count: int, created_at, updated_at }`
Seeded units: `PCS` Piece, `BOX` Box, `KG` Kilogram (decimal), `L` Litre (decimal).

## 3. Categories — `/api/v1/categories`

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/categories` | `products.view` | not paginated; sorted by name; optional `?search=` |
| POST | `/categories` | `catalog.manage` | → 201 `Category` |
| PUT | `/categories/{id}` | `catalog.manage` | → `Category` |
| DELETE | `/categories/{id}` | `catalog.manage` | 409 `CATEGORY_IN_USE` |

`CategoryInput`: `{ name: string 2–100 (unique, case-insensitive), description?: string ≤500|null, is_active?: bool }` → 409 `CATEGORY_NAME_TAKEN` (details.name)
`Category`: `{ id, name, description, is_active, products_count, created_at, updated_at }`

## 4. Products — `/api/v1/products`

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/products` | `products.view` | filters: `search` (sku/name/barcode), `category_id`, `is_active` (true/false); sort: `name, sku, selling_price, created_at` |
| POST | `/products` | `products.create` | → 201 `Product` |
| GET | `/products/{id}` | `products.view` | `Product` |
| PUT | `/products/{id}` | `products.update` | → `Product` |

No delete; deactivate with `is_active: false`.

`ProductInput`:
```json
{
  "sku": "string 2–40, A-Z0-9 . _ -, unique, stored uppercase",
  "barcode": "string 4–64 (A-Z a-z 0-9 -), unique | null",
  "name": "string 2–150",
  "description": "string ≤2000 | null",
  "category_id": "uuid | null",
  "unit_id": "uuid",
  "cost_price": "money ≥ 0",
  "selling_price": "money ≥ 0",
  "tax_rate": "percent 0–100 (default 0)",
  "track_stock": true,
  "is_active": true
}
```
Errors: 409 `SKU_TAKEN` (details.sku), 409 `BARCODE_TAKEN` (details.barcode), 422 on `category_id` / `unit_id` when they don't exist (or the category is inactive).

`Product`:
```json
{
  "id": "uuid", "sku": "COKE-500", "barcode": "8901234567890", "name": "Coca-Cola 500ml",
  "description": null,
  "category": { "id": "uuid", "name": "Beverages" },
  "unit": { "id": "uuid", "code": "PCS", "name": "Piece", "allows_decimal": false },
  "cost_price": "35.00", "selling_price": "45.00", "tax_rate": "5.00",
  "margin_percent": "22.22",
  "track_stock": true, "is_active": true,
  "created_at": "iso", "updated_at": "iso"
}
```
`category` may be null. `margin_percent` = (selling − cost) / selling × 100, rounded to 2 decimals; it's `null` when the selling price is 0.

## 5. Inventory (scoped to the active branch) — `/api/v1/inventory`

### Stock levels

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/inventory/stock` | `inventory.view` | paginated. Lists **active products with `track_stock: true`**, including ones that have never had stock (quantity `"0.000"`). Filters: `search` (sku/name/barcode), `status` (`in_stock`/`low_stock`/`out_of_stock`). Sort: `name, sku, quantity` (default `name`). |
| GET | `/inventory/stock/{productId}` | `inventory.view` | `StockItem` |
| PUT | `/inventory/stock/{productId}/reorder-level` | `inventory.adjust` | `{ reorder_level: quantity ≥ 0 }` → `StockItem` |
| GET | `/inventory/summary` | `inventory.view` | `StockSummary` |

`StockItem`:
```json
{
  "product_id": "uuid", "sku": "COKE-500", "name": "Coca-Cola 500ml", "barcode": "890...",
  "unit": { "code": "PCS", "allows_decimal": false },
  "quantity": "24.000", "reorder_level": "10.000",
  "status": "in_stock",
  "stock_value": "840.00",
  "last_movement_at": "iso|null"
}
```
`status`: `out_of_stock` when quantity ≤ 0; `low_stock` when 0 < quantity ≤ reorder_level and reorder_level > 0; otherwise `in_stock`. `stock_value` = quantity × the product's current cost_price.

`StockSummary`: `{ "tracked_products": 120, "in_stock": 100, "low_stock": 12, "out_of_stock": 8, "stock_value": "152340.50" }`

### Adjustments

| Method | Path | Permission | Notes |
|---|---|---|---|
| POST | `/inventory/adjustments` | `inventory.adjust` | supports `Idempotency-Key`; → 201 `{ movement: Movement, stock: StockItem }` |

`AdjustmentInput`:
```json
{
  "product_id": "uuid",
  "type": "in | out | count",
  "quantity": "quantity > 0 for in/out; ≥ 0 for count (the counted, absolute on-hand quantity)",
  "reason": "opening | received | damaged | expired | lost | returned | correction | other",
  "note": "string ≤500 | null"
}
```
Rules:
- `out` can't take stock below zero → 422 `INSUFFICIENT_STOCK`, with `details.available` set to the current quantity string.
- `count` records the difference between the counted and current quantity. If they're equal → 422 `NO_STOCK_CHANGE`.
- The product must be active and have `track_stock: true`, otherwise 422 `PRODUCT_NOT_STOCKABLE`. An unknown product gives 404 `PRODUCT_NOT_FOUND`.

### Movement ledger (append-only)

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/inventory/movements` | `inventory.view` | paginated; active branch only. Filters: `product_id`, `type`, `from`, `to` (dates `YYYY-MM-DD`, inclusive). Sort: `created_at` (default `-created_at`). |

`Movement`:
```json
{
  "id": "uuid",
  "product_id": "uuid", "sku": "COKE-500", "product_name": "Coca-Cola 500ml",
  "type": "adjustment_in | adjustment_out | count",
  "reason": "received",
  "quantity": "-2.000",
  "balance_after": "22.000",
  "note": null,
  "user": { "id": "uuid", "name": "Jane" },
  "created_at": "iso"
}
```
`quantity` is signed: positive adds stock, negative removes it. Future modules will add the types `sale`, `sale_return`, `purchase`, `transfer_in`, `transfer_out`.
