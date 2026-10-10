
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.database import engine
from app.schemas import PurchaseOrderData, PurchaseOrderItemData

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])


@router.get("/")
def get_purchase_orders():
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT
                    po.purchase_order_id,
                    s.name AS supplier,
                    b.name AS branch,
                    po.status,
                    po.created_at,
                    po.received_at,
                    COALESCE(SUM(poi.quantity * poi.unit_cost), 0)
                        AS total_cost
                FROM purchase_orders po
                JOIN suppliers s ON po.supplier_id = s.supplier_id
                JOIN branches b ON po.branch_id = b.branch_id
                LEFT JOIN purchase_order_items poi
                    ON po.purchase_order_id = poi.purchase_order_id
                GROUP BY
                    po.purchase_order_id,
                    s.name,
                    b.name
                ORDER BY po.created_at DESC
            """)
        )
        return [dict(row) for row in result.mappings()]


@router.post("/", status_code=201)
def create_purchase_order(data: PurchaseOrderData):
    try:
        with engine.begin() as conn:
            result = conn.execute(
                text("""
                    INSERT INTO purchase_orders (supplier_id, branch_id)
                    VALUES (:supplier_id, :branch_id)
                    RETURNING *
                """),
                data.model_dump()
            )
            order = result.mappings().one()

    except IntegrityError:
        raise HTTPException(404, "Supplier or branch not found")

    return dict(order)


@router.get("/{order_id}/items")
def get_order_items(order_id: int):
    with engine.connect() as conn:
        order = conn.execute(
            text("""
                SELECT 1 FROM purchase_orders
                WHERE purchase_order_id = :id
            """),
            {"id": order_id}
        ).first()

        if not order:
            raise HTTPException(404, "Purchase order not found")

        result = conn.execute(
            text("""
                SELECT
                    poi.purchase_order_item_id,
                    p.product_id,
                    p.name AS product,
                    poi.quantity,
                    poi.unit_cost,
                    poi.quantity * poi.unit_cost AS total
                FROM purchase_order_items poi
                JOIN products p ON poi.product_id = p.product_id
                WHERE poi.purchase_order_id = :id
                ORDER BY p.name
            """),
            {"id": order_id}
        )
        return [dict(row) for row in result.mappings()]


@router.post("/{order_id}/items", status_code=201)
def add_order_item(order_id: int, data: PurchaseOrderItemData):
    try:
        with engine.begin() as conn:
            order = conn.execute(
                text("""
                    SELECT supplier_id, status
                    FROM purchase_orders
                    WHERE purchase_order_id = :id
                    FOR UPDATE
                """),
                {"id": order_id}
            ).mappings().first()

            if not order:
                raise HTTPException(404, "Purchase order not found")

            if order["status"] != "draft":
                raise HTTPException(409, "Order is already received")

            supplier_product = conn.execute(
                text("""
                    SELECT supplier_price
                    FROM supplier_products
                    WHERE supplier_id = :supplier_id
                      AND product_id = :product_id
                """),
                {
                    "supplier_id": order["supplier_id"],
                    "product_id": data.product_id
                }
            ).mappings().first()

            if not supplier_product:
                raise HTTPException(
                    400, "This supplier does not offer the selected product"
                )

            result = conn.execute(
                text("""
                    INSERT INTO purchase_order_items (
                        purchase_order_id, product_id,
                        quantity, unit_cost
                    )
                    VALUES (:order_id, :product_id, :quantity, :unit_cost)
                    RETURNING *
                """),
                {
                    "order_id": order_id,
                    "product_id": data.product_id,
                    "quantity": data.quantity,
                    "unit_cost": supplier_product["supplier_price"]
                }
            )
            item = result.mappings().one()

    except IntegrityError as error:
        if error.orig.sqlstate == "23505":
            raise HTTPException(409, "Product already added to this order")
        raise HTTPException(400, "Invalid purchase order item")

    return dict(item)


@router.post("/{order_id}/receive")
def receive_purchase_order(order_id: int):
    with engine.begin() as conn:
        order = conn.execute(
            text("""
                SELECT branch_id, status
                FROM purchase_orders
                WHERE purchase_order_id = :id
                FOR UPDATE
            """),
            {"id": order_id}
        ).mappings().first()

        if not order:
            raise HTTPException(404, "Purchase order not found")

        if order["status"] != "draft":
            raise HTTPException(409, "Order is already received")

        items = conn.execute(
            text("""
                SELECT product_id, quantity
                FROM purchase_order_items
                WHERE purchase_order_id = :id
                ORDER BY product_id
            """),
            {"id": order_id}
        ).mappings().all()

        if not items:
            raise HTTPException(400, "Cannot receive an empty order")

        for item in items:
            conn.execute(
                text("""
                    INSERT INTO inventory (branch_id, product_id, quantity)
                    VALUES (:branch_id, :product_id, :quantity)
                    ON CONFLICT (branch_id, product_id)
                    DO UPDATE SET
                        quantity = inventory.quantity + EXCLUDED.quantity
                """),
                {
                    "branch_id": order["branch_id"],
                    "product_id": item["product_id"],
                    "quantity": item["quantity"]
                }
            )

        conn.execute(
            text("""
                UPDATE purchase_orders
                SET status = 'received',
                    received_at = NOW()
                WHERE purchase_order_id = :id
            """),
            {"id": order_id}
        )

    return {"message": "Purchase order received successfully"}