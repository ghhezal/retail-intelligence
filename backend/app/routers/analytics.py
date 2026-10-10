
from fastapi import APIRouter, Query
from sqlalchemy import text

from app.database import engine

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# Dashboard summary
@router.get("/summary")
def get_summary(branch_id: int | None = Query(None, gt=0)):
    sales_filter = ""
    inventory_filter = ""
    params = {}

    if branch_id is not None:
        sales_filter = "WHERE s.branch_id = :branch_id"
        inventory_filter = "AND i.branch_id = :branch_id"
        params["branch_id"] = branch_id

    with engine.connect() as conn:
        sales = conn.execute(
            text(f"""
                SELECT
                    COUNT(DISTINCT s.sale_id) AS total_sales,
                    COALESCE(SUM(si.quantity * si.unit_price), 0) AS revenue,
                    COALESCE(SUM(
                        si.quantity * (si.unit_price - si.unit_cost)
                    ), 0) AS gross_profit,
                    COALESCE(SUM(si.quantity), 0) AS units_sold
                FROM sales s
                LEFT JOIN sale_items si ON s.sale_id = si.sale_id
                {sales_filter}
            """),
            params
        ).mappings().one()

        inventory = conn.execute(
            text(f"""
                SELECT
                    COALESCE(SUM(i.quantity), 0) AS stock_units,
                    COUNT(*) FILTER (
                        WHERE i.quantity <= i.reorder_level
                    ) AS low_stock_items
                FROM inventory i
                JOIN products p ON i.product_id = p.product_id
                WHERE p.is_active = TRUE
                {inventory_filter}
            """),
            params
        ).mappings().one()

    return {
        **dict(sales),
        **dict(inventory)
    }


# Monthly sales for the last 12 calendar months
@router.get("/monthly-sales")
def get_monthly_sales(branch_id: int | None = Query(None, gt=0)):
    branch_filter = ""
    params = {}

    if branch_id is not None:
        branch_filter = "AND s.branch_id = :branch_id"
        params["branch_id"] = branch_id

    with engine.connect() as conn:
        result = conn.execute(
            text(f"""
                SELECT
                    m.month::date AS month,
                    COUNT(DISTINCT s.sale_id) AS total_sales,
                    COALESCE(SUM(si.quantity * si.unit_price), 0)
                        AS revenue
                FROM generate_series(
                    DATE_TRUNC('month', CURRENT_DATE)
                        - INTERVAL '11 months',
                    DATE_TRUNC('month', CURRENT_DATE),
                    INTERVAL '1 month'
                ) AS m(month)
                LEFT JOIN sales s
                    ON s.sold_at >= m.month
                    AND s.sold_at < m.month + INTERVAL '1 month'
                    {branch_filter}
                LEFT JOIN sale_items si ON s.sale_id = si.sale_id
                GROUP BY m.month
                ORDER BY m.month
            """),
            params
        )

        return [dict(row) for row in result.mappings()]


# Compare branches
@router.get("/branches")
def get_branch_performance():
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT
                    b.branch_id,
                    b.name AS branch,
                    COUNT(DISTINCT s.sale_id) AS total_sales,
                    COALESCE(SUM(si.quantity * si.unit_price), 0)
                        AS revenue,
                    COALESCE(SUM(
                        si.quantity * (si.unit_price - si.unit_cost)
                    ), 0) AS gross_profit
                FROM branches b
                LEFT JOIN sales s ON b.branch_id = s.branch_id
                LEFT JOIN sale_items si ON s.sale_id = si.sale_id
                GROUP BY b.branch_id, b.name
                ORDER BY revenue DESC
            """)
        )

        return [dict(row) for row in result.mappings()]


# Best-selling products
@router.get("/top-products")
def get_top_products(
    branch_id: int | None = Query(None, gt=0),
    limit: int = Query(10, ge=1, le=50)
):
    branch_filter = ""
    params = {"limit": limit}

    if branch_id is not None:
        branch_filter = "WHERE s.branch_id = :branch_id"
        params["branch_id"] = branch_id

    with engine.connect() as conn:
        result = conn.execute(
            text(f"""
                SELECT
                    p.product_id,
                    p.name AS product,
                    p.sku,
                    SUM(si.quantity) AS units_sold,
                    SUM(si.quantity * si.unit_price) AS revenue
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.sale_id
                JOIN products p ON si.product_id = p.product_id
                {branch_filter}
                GROUP BY p.product_id, p.name, p.sku
                ORDER BY units_sold DESC, p.product_id
                LIMIT :limit
            """),
            params
        )

        return [dict(row) for row in result.mappings()]


# Products that need restocking
@router.get("/low-stock")
def get_low_stock(branch_id: int | None = Query(None, gt=0)):
    branch_filter = ""
    params = {}

    if branch_id is not None:
        branch_filter = "AND i.branch_id = :branch_id"
        params["branch_id"] = branch_id

    with engine.connect() as conn:
        result = conn.execute(
            text(f"""
                SELECT
                    b.name AS branch,
                    p.product_id,
                    p.name AS product,
                    p.sku,
                    i.quantity,
                    i.reorder_level
                FROM inventory i
                JOIN branches b ON i.branch_id = b.branch_id
                JOIN products p ON i.product_id = p.product_id
                WHERE i.quantity <= i.reorder_level
                  AND p.is_active = TRUE
                  {branch_filter}
                ORDER BY i.quantity, b.name
            """),
            params
        )

        return [dict(row) for row in result.mappings()]


# Sales by category
@router.get("/categories")
def get_category_sales(branch_id: int | None = Query(None, gt=0)):
    branch_filter = ""
    params = {}

    if branch_id is not None:
        branch_filter = "WHERE s.branch_id = :branch_id"
        params["branch_id"] = branch_id

    with engine.connect() as conn:
        result = conn.execute(
            text(f"""
                SELECT
                    c.name AS category,
                    SUM(si.quantity) AS units_sold,
                    SUM(si.quantity * si.unit_price) AS revenue
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.sale_id
                JOIN products p ON si.product_id = p.product_id
                JOIN categories c ON p.category_id = c.category_id
                {branch_filter}
                GROUP BY c.category_id, c.name
                ORDER BY revenue DESC
            """),
            params
        )

        return [dict(row) for row in result.mappings()]
