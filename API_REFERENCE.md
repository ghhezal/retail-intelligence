# API_REFERENCE.md — Retail Intelligence FastAPI

## Important: verify against source
This reference is based on the FastAPI code built earlier in the project conversation. **Before implementation, inspect `backend/app/routers/*.py`, `backend/app/schemas.py`, and preferably `http://127.0.0.1:8000/openapi.json`.** There has been no live inspection of the local repository for this documentation pack. If there is a mismatch, the working backend wins; update the client and note the difference.

## Connection and conventions
- Base URL in local development: `http://127.0.0.1:8000`.
- React reads `import.meta.env.VITE_API_URL` (e.g. `frontend/.env`). **Do not put a trailing slash** in the base URL or handle slashes centrally.
- JSON request and response bodies, except empty action requests like `/receive` and `/complete`.
- List routes return a **bare JSON array**, not `{ items: [...] }`.
- FastAPI errors generally look like `{ "detail": "Message" }`; validation errors may have an array in `detail`.
- Money comes from PostgreSQL `NUMERIC` and may arrive as numbers or strings. For display, normalize and format as **USD**. Never use floating-point values for business-critical price computation in the frontend.
- Dates arrive as ISO-8601 timestamp strings; format for humans in UI.
- Backend currently has **no auth** and must not be publicly exposed with unrestricted write methods.
- Slash conventions: routers are mounted with prefixes and use `/` for collection endpoints (e.g. `/products/`), while nested actions use paths shown below.
- Endpoint ID parameters are positive integers (where validated); use `encodeURIComponent` for user text/query parameters.

## Inventory of implemented routes

### Health
| Method | Path | Behavior |
|---|---|---|
| GET | `/` | API status message |
| GET | `/db-check` | Connectivity/product-count test: `{ "database": "connected", "products": 150 }` (count varies) |

### Products
| Method | Path | Params/body | Response and notes |
|---|---|---|---|
| GET | `/products/` | `search?`, `category_id?`, `brand_id?`, `include_inactive=false`, `limit=200` (1–500), `offset=0` | Array of products, ordered by ID; **no `total` pagination count** |
| GET | `/products/{product_id}` | Path ID | Product object or 404 |
| POST | `/products/` | `ProductData` below | `201`, created product object; 409 duplicate SKU; invalid brand/category may give 400 |
| PUT | `/products/{product_id}` | Full `ProductData` | Updated product; 404/409/400 possible |
| DELETE | `/products/{product_id}` | Path ID | `{ "message": "Product deactivated" }`; **soft delete**, not physical removal |

**`ProductData` JSON** (both POST and PUT; all fields except description required):
```json
{
  "category_id": 3,
  "brand_id": 8,
  "sku": "DEMO-MOUSE-001",
  "name": "Demo Wireless Mouse",
  "description": "Optional product description",
  "cost_price": 15.00,
  "selling_price": 25.00
}
```

**Product response**: `product_id`, `category_id`, `brand_id`, `sku`, `name`, `description`, `cost_price`, `selling_price`, `is_active`, `created_at`, and display fields `category` and `brand`. The exact JSON serialization of amounts and timestamps is determined by FastAPI.

**Caution:** Search matches `p.name` or `p.sku` using `ILIKE`, but in the prior code it does **not** also search the separate brand name unless that brand appears within `p.name`.

### Categories and brands
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/categories/` | — | Array of `{ category_id, name, description }` |
| GET | `/categories/{category_id}` | — | One category or 404 |
| POST | `/categories/` | `{ "name": "...", "description": "..." }` | Creates; 201 or 409 duplicate |
| PUT | `/categories/{category_id}` | Same complete body | Replaces name/description; 404 or 409 |
| DELETE | `/categories/{category_id}` | — | Physical delete; 409 if products reference category |
| GET | `/brands/` | — | Array of `{ brand_id, name }` |
| POST | `/brands/` | `{ "name": "Corsair" }` | Creates brand; 201 or 409 duplicate |

**Not implemented:** edit/delete brand, create/edit/delete branch. Do not present buttons pretending these are supported.

### Branches
| Method | Path | Returns |
|---|---|---|
| GET | `/branches/` | Array of `{ branch_id, name, city, address, phone }` |
| GET | `/branches/{branch_id}` | One branch or 404 |

### Inventory
| Method | Path | Params/body | Notes |
|---|---|---|---|
| GET | `/inventory/` | `branch_id?`, `search?`, `low_stock_only=false` | Array with `branch_id`, `product_id`, `branch`, `product`, `sku`, `quantity`, `reorder_level`, `low_stock` |
| GET | `/inventory/{branch_id}/{product_id}` | IDs | Single raw inventory row or 404 |
| POST | `/inventory/` | `InventoryData` | Create new `(branch,product)` stock record; 201; 409 duplicate, 404 invalid FK |
| PUT | `/inventory/{branch_id}/{product_id}` | `InventoryUpdate` | Set absolute quantity and reorder level; 200; 404 if no row |

**`InventoryData`**:
```json
{"branch_id": 1, "product_id": 151, "quantity": 12, "reorder_level": 5}
```
**`InventoryUpdate`**: both fields required:
```json
{"quantity": 20, "reorder_level": 8}
```

Low-stock means `quantity <= reorder_level`; a product with no inventory record at a branch is **not** in the returned rows. This version allows manual stock correction through PUT; it does not generate adjustment history.

### Suppliers and supplier-product links
| Method | Path | Params/body | Notes |
|---|---|---|---|
| GET | `/suppliers/` | — | Array of supplier records |
| POST | `/suppliers/` | `SupplierData` | Create; 201 |
| PUT | `/suppliers/{supplier_id}` | Full `SupplierData` | Update; 404 if missing |
| GET | `/suppliers/{supplier_id}/products` | ID | Array of `product_id`, `name`, `sku`, `supplier_price` |
| POST | `/suppliers/{supplier_id}/products` | `SupplierProductData` | Associate product with supplier; 201, 409 duplicate, 404 bad FK |

**`SupplierData`**:
```json
{"name": "NorthTech Distribution", "email": "vendor@example.com", "phone": "0550000000", "address": "Optional address"}
```
`email`, `phone`, `address` may be null. Supplier name required.

**`SupplierProductData`**:
```json
{"product_id": 12, "supplier_sku": "SUP-012", "supplier_price": 98.50}
```
The source backend does not include supplier DELETE or a supplier-product removal/update endpoint.

### Purchase orders
| Method | Path | Params/body | Notes |
|---|---|---|---|
| GET | `/purchase-orders/` | — | Array with `purchase_order_id`, supplier **name**, branch **name**, `status`, `created_at`, `received_at`, `total_cost` |
| POST | `/purchase-orders/` | `{ "supplier_id": 1, "branch_id": 1 }` | Create draft; 201 |
| GET | `/purchase-orders/{order_id}/items` | ID | Array of items with product name, quantity, unit cost and total; 404 if order missing |
| POST | `/purchase-orders/{order_id}/items` | `{ "product_id": 1, "quantity": 10 }` | Adds product at supplier-product **server-side price**; 201, 400 not supplied, 409 duplicate/already received |
| POST | `/purchase-orders/{order_id}/receive` | No body | Atomic stock addition and transition `draft -> received`; 200 message; 400 empty, 409 repeated |

The list endpoint **does not necessarily return `supplier_id` or `branch_id`**; do not assume IDs are present in list objects. There is no separate `GET /purchase-orders/{id}` documented. The UI can use the order list plus `/items` for detail views.

After a successful receive, refetch the purchase order list, its items, and affected inventory. Do **not** call `PUT /inventory` to manually increase stock.

### Sales / POS
| Method | Path | Params/body | Notes |
|---|---|---|---|
| GET | `/sales/` | `branch_id?`, `limit=50` (1–200), `offset=0` | Array of `sale_id`, `sold_at`, `branch`, `customer`, `payment_method`, `total` |
| GET | `/sales/{sale_id}` | ID | Sale header, `items` array and `total`; 404 if absent |
| POST | `/sales/` | `SaleData` | Atomic creation of sale, items and stock deduction; 201 with sale detail; 409 insufficient stock; 400/404 validation/business errors |

**`SaleData`**:
```json
{
  "branch_id": 1,
  "customer_id": null,
  "payment_method": "cash",
  "items": [
    {"product_id": 1, "quantity": 1},
    {"product_id": 2, "quantity": 2}
  ]
}
```
Payment method only `cash`, `card`, `bank_transfer`. Minimum one item; product IDs must be unique within the sale. Backend sets `unit_price`/`unit_cost` from the product at time of sale. The UI must not submit a total or editable unit price. Customer is optional; there is **no customers API implemented** in the documented backend, so the default POS UX should support walk-in (`customer_id: null`) without a customer-picker requiring a missing endpoint.

Sale detail items have `product_id`, `product`, `quantity`, `unit_price`, `unit_cost`, `total`. No refund, void, edit or delete API exists.

### Stock transfers
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/stock-transfers/` | — | Array with transfer ID, **branch names**, `status`, dates, `product_count` |
| GET | `/stock-transfers/{transfer_id}` | — | Transfer header with **branch IDs** and `items` array |
| POST | `/stock-transfers/` | `{ "from_branch_id": 1, "to_branch_id": 2 }` | Draft; 201; 400 identical branches, 404 missing |
| POST | `/stock-transfers/{transfer_id}/items` | `{ "product_id": 1, "quantity": 2 }` | Add active product; 201; 409 duplicate/completed |
| POST | `/stock-transfers/{transfer_id}/complete` | No body | Atomic decrement source + increment destination; 200 message; 409 insufficient stock or repeated completion; 400 empty |

Use the branch lookup list to display branch names when viewing individual transfers. Completing is final in this MVP; do not add edit/cancel buttons.

### Analytics
All analytics endpoints use GET and return **real SQL aggregate results**. Unless noted, endpoints accepting `branch_id` take an optional positive integer query parameter.

| Path | Params | Response shape |
|---|---|---|
| `/analytics/summary` | `branch_id?` | One object: `total_sales`, `revenue`, `gross_profit`, `units_sold`, `stock_units`, `low_stock_items` |
| `/analytics/monthly-sales` | `branch_id?` | Array of **12** `{ month, total_sales, revenue }` points, oldest to newest; may include months with zero revenue |
| `/analytics/branches` | None | Array `{ branch_id, branch, total_sales, revenue, gross_profit }` |
| `/analytics/top-products` | `branch_id?`, `limit=10` (1–50) | Array `{ product_id, product, sku, units_sold, revenue }` |
| `/analytics/low-stock` | `branch_id?` | Array `{ branch, product_id, product, sku, quantity, reorder_level }` |
| `/analytics/categories` | `branch_id?` | Array `{ category, units_sold, revenue }` |

**Crucial semantics:** `/analytics/summary` is **all-time**, not limited to 12 months; `/analytics/monthly-sales` is last 12 calendar months; `/analytics/branches` is always all branches and does not accept `branch_id`. Both stock endpoints consider low-stock when `quantity <= reorder_level`, and analytics/summary excludes inactive product inventory from inventory totals. Category sales group by products' current category assignment.

## Supported UI workflow examples

### Add a new hardware product and opening inventory
1. `GET /categories/` and `GET /brands/` for selectors; optionally `POST /brands/` or `POST /categories/`.
2. `POST /products/`; read returned `product_id`.
3. `POST /inventory/` for one or more branches if stock is available. Creating a product alone does **not** create inventory.

### Receive stock from supplier
1. `GET /suppliers/` and `GET /suppliers/{id}/products`.
2. `POST /purchase-orders/` (draft).
3. `POST /purchase-orders/{order_id}/items` for each selected product.
4. Confirm, then `POST /purchase-orders/{order_id}/receive` exactly once.
5. Refetch inventory and analytics; backend already adjusted stock.

### Checkout
1. User selects branch, active product(s) and positive quantities.
2. `POST /sales/` once; button disabled while request is in flight.
3. Show actual sale receipt from server; refetch inventory and analytics. On 409, retain basket and show stock problem; do not pretend the sale succeeded.

### Move stock
1. `POST /stock-transfers/` (draft, different branches).
2. `POST /stock-transfers/{id}/items` for products.
3. Confirm; `POST /stock-transfers/{id}/complete` once.
4. Refetch both branch inventories and transfer list; show error on insufficient source stock.

## Integration notes and known limitations
- Browser API client should centralize `GET/POST/PUT/DELETE`, query parameters, JSON body, error parsing, and `VITE_API_URL`.
- `Content-Type: application/json` for JSON writes; `POST` with no body on receive/complete.
- Avoid page-wide loading spinners for every action; show appropriate per-page and button pending state.
- There is no API for a paginated **total count** of products/sales; do not show falsely precise "page 3 of 5" counts. Use Next/Previous based on returned page length if needed.
- `GET /suppliers/{id}/products` currently does not return `supplier_sku`; do not expect it in the supplier product table.
- No backend-supported period filters for analytics beyond fixed last 12 months; do not design arbitrary date filters as if functional.
- For production demo security, client-side hiding is insufficient. See `AGENTS.md`.
