# Retail Intelligence

> Multi-Branch Computer Hardware Inventory & Sales Analytics System

Retail Intelligence is a full-stack retail management web application built for an Algerian computer hardware retailer operating three physical branches (**Algiers Central**, **Oran West**, and **Constantine East**). The system manages catalog items, branch-level stock, walk-in and credit POS checkouts, supplier restock orders, and inter-branch stock rebalancing with transactional consistency.

---

## Architecture & Tech Stack

```text
┌─────────────────────────────────┐
│     React + Vite Frontend       │
│  (Tailwind v4, Recharts, Icons) │
└────────────────┬────────────────┘
                 │ HTTP REST (JSON)
┌────────────────▼────────────────┐
│      FastAPI Backend Engine     │
│   (Python, SQLAlchemy, Psycopg) │
└────────────────┬────────────────┘
                 │ PostgreSQL Connection Pooling
┌────────────────▼────────────────┐
│   Neon PostgreSQL Database      │
│     (14 Normalized Tables)      │
└─────────────────────────────────┘
```

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, React Router v7, Recharts 3, Lucide React.
- **Backend:** Python 3, FastAPI, SQLAlchemy, Pydantic, Uvicorn.
- **Database:** Serverless PostgreSQL on Neon (14 normalized relational tables).

---

## Six Primary Application Modules

1. **Dashboard (`/dashboard`):** Real-time aggregate KPIs (All-time Revenue, Gross Profit, Completed Sales, Available Stock Units), 12-month revenue trend line/area chart, 3-store performance comparison, revenue by hardware category, best-selling hardware ranked list, and low-stock restock alerts with branch filtering.
2. **Products Catalog (`/products`):** Multi-filter hardware catalog (name/SKU search, category, brand, active status), product addition with validation, price/specification editing, soft deactivation (`DELETE /products/{id}`), category management, and brand registry.
3. **Branch Inventory (`/inventory`):** Branch-specific stock matrix with search, reorder threshold indicators, low-stock filter toggle, manual stock audit correction (`PUT /inventory/{branch}/{product}`), and new branch inventory registration (`POST /inventory/`).
4. **Sales & POS Checkout (`/sales`):**
   - **Sales History:** Filterable transaction history with payment method badges and official modal receipt rendering itemized lines and server-computed totals.
   - **New Sale / POS:** Interactive multi-item checkout with live branch stock checks, unit price lookup, duplicate merging, walk-in customer support, and atomic checkout via `POST /sales/`.
5. **Suppliers & Purchases (`/suppliers`):**
   - **Suppliers Directory:** Distributor directory with contact cards, vendor catalog management, and supplier-product cost linking (`POST /suppliers/{id}/products`).
   - **Purchase Orders:** Draft PO creation (`POST /purchase-orders/`), itemized vendor product additions, and atomic receiving (`POST /purchase-orders/{id}/receive`) that credits branch stock.
6. **Stock Transfers (`/transfers`):** Inter-branch inventory rebalancing. Create draft transfer between two branches (`POST /stock-transfers/`), add products, check origin stock, and finalize transfer (`POST /stock-transfers/{id}/complete`) which moves stock atomically between stores.

---

## Local Development Setup

### 1. Backend Setup

```bash
cd backend
# Activate virtual environment
.\.venv\Scripts\activate   # On Windows
# source .venv/bin/activate  # On macOS/Linux

# Start FastAPI Uvicorn server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation and Swagger UI will be available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend
# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
The application will launch on `http://localhost:5173`.

### 3. Environment Variables

Create `frontend/.env`:
```env
VITE_API_URL=http://127.0.0.1:8000
```
