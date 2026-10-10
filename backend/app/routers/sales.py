
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.database import engine
from app.schemas import SaleData

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.get("/")
def get_sales(
    branch_id: int | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    query = """
        SELECT
            s.sale_id,
            s.sold_at,
            b.name AS branch,
            COALESCE(c.full_name, 'Walk-in Customer') AS customer,
            s.payment_method,
            COALESCE(SUM(si.quantity * si.unit_price), 0) AS total
        FROM sales s
        JOIN branches b ON s.branch_id = b.branch_id
        LEFT JOIN customers c ON s.customer_id = c.customer_id
        LEFT JOIN sale_items si ON s.sale_id = si.sale_id
        WHERE 1=1
    """

    params = {"limit": limit, "offset": offset}

    if branch_id is not None:
        query += " AND s.branch_id = :branch_id"
        params["branch_id"] = branch_id

    query += """
        GROUP BY s.sale_id, b.name, c.full_name
        ORDER BY s.sold_at DESC, s.sale_id DESC
        LIMIT :limit OFFSET :offset
    """

    with engine.connect() as conn:
        result = conn.execute(text(query), params)
        return [dict(row) for row in result.mappings()]


@router.get("/{sale_id}")
def get_sale(sale_id: int):
    with engine.connect() as conn:
        sale = conn.execute(
            text("""
                SELECT
                    s.*,
                    b.name AS branch,
                    COALESCE(c.full_name, 'Walk-in Customer') AS customer
                FROM sales s
                JOIN branches b ON s.branch_id = b.branch_id
                LEFT JOIN customers c ON s.customer_id = c.customer_id
                WHERE s.sale_id = :id
            """),
            {"id": sale_id}
        ).mappings().first()

        if not sale:
            raise HTTPException(404, "Sale not found")

        result = conn.execute(
            text("""
                SELECT
                    si.product_id,
                    p.name AS product,
                    si.quantity,
                    si.unit_price,
                    si.unit_cost,
                    si.quantity * si.unit_price AS total
                FROM sale_items si
                JOIN products p ON si.product_id = p.product_id
                WHERE si.sale_id = :id
                ORDER BY si.sale_item_id
            """),
            {"id": sale_id}
        )

        items = [dict(row) for row in result.mappings()]

    return {
        **dict(sale),
        "items": items,
        "total": sum(item["total"] for item in items)
    }


@router.post("/", status_code=201)
def create_sale(data: SaleData):
    product_ids = [item.product_id for item in data.items]

    if len(product_ids) != len(set(product_ids)):
        raise HTTPException(400, "Duplicate products in sale")

    try:
        with engine.begin() as conn:

            branch = conn.execute(
                text("SELECT 1 FROM branches WHERE branch_id = :id"),
                {"id": data.branch_id}
            ).first()

            if not branch:
                raise HTTPException(404, "Branch not found")
            
            if data.customer_id is not None:
                customer = conn.execute(
                    text("SELECT 1 FROM customers WHERE customer_id = :id"),
                    {"id": data.customer_id}
                ).first()

                if not customer:
                    raise HTTPException(404, "Customer not found")

            sale_id = conn.execute(
                text("""
                    INSERT INTO sales (
                        branch_id, customer_id, payment_method
                    )
                    VALUES (
                        :branch_id, :customer_id, :payment_method
                    )
                    RETURNING sale_id
                """),
                {
                    "branch_id": data.branch_id,
                    "customer_id": data.customer_id,
                    "payment_method": data.payment_method
                }
            ).scalar_one()

            for item in sorted(data.items, key=lambda x: x.product_id):

                product = conn.execute(
                    text("""
                        SELECT selling_price, cost_price
                        FROM products
                        WHERE product_id = :id
                          AND is_active = TRUE
                    """),
                    {"id": item.product_id}
                ).mappings().first()

                if not product:
                    raise HTTPException(
                        404, f"Product {item.product_id} not found or inactive"
                    )

                stock = conn.execute(
                    text("""
                        UPDATE inventory
                        SET quantity = quantity - :quantity
                        WHERE branch_id = :branch_id
                          AND product_id = :product_id
                          AND quantity >= :quantity
                        RETURNING quantity
                    """),
                    {
                        "branch_id": data.branch_id,
                        "product_id": item.product_id,
                        "quantity": item.quantity
                    }
                ).first()

                if stock is None:
                    raise HTTPException(
                        409,
                        f"Not enough stock for product {item.product_id}"
                    )

                conn.execute(
                    text("""
                        INSERT INTO sale_items (
                            sale_id, product_id, quantity,
                            unit_price, unit_cost
                        )
                        VALUES (
                            :sale_id, :product_id, :quantity,
                            :unit_price, :unit_cost
                        )
                    """),
                    {
                        "sale_id": sale_id,
                        "product_id": item.product_id,
                        "quantity": item.quantity,
                        "unit_price": product["selling_price"],
                        "unit_cost": product["cost_price"]
                    }
                )

    except IntegrityError:
        raise HTTPException(400, "Invalid sale data")

    return get_sale(sale_id)
