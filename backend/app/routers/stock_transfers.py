
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.database import engine
from app.schemas import StockTransferData, StockTransferItemData

router = APIRouter(prefix="/stock-transfers", tags=["Stock Transfers"])


@router.get("/")
def get_stock_transfers():
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT
                    st.transfer_id,
                    b1.name AS from_branch,
                    b2.name AS to_branch,
                    st.status,
                    st.created_at,
                    st.completed_at,
                    COUNT(sti.transfer_item_id) AS product_count
                FROM stock_transfers st
                JOIN branches b1 ON st.from_branch_id = b1.branch_id
                JOIN branches b2 ON st.to_branch_id = b2.branch_id
                LEFT JOIN stock_transfer_items sti
                    ON st.transfer_id = sti.transfer_id
                GROUP BY st.transfer_id, b1.name, b2.name
                ORDER BY st.created_at DESC
            """)
        )

        return [dict(row) for row in result.mappings()]


@router.get("/{transfer_id}")
def get_stock_transfer(transfer_id: int):
    with engine.connect() as conn:
        transfer = conn.execute(
            text("""
                SELECT *
                FROM stock_transfers
                WHERE transfer_id = :id
            """),
            {"id": transfer_id}
        ).mappings().first()

        if not transfer:
            raise HTTPException(404, "Stock transfer not found")

        result = conn.execute(
            text("""
                SELECT
                    sti.product_id,
                    p.name AS product,
                    sti.quantity
                FROM stock_transfer_items sti
                JOIN products p ON sti.product_id = p.product_id
                WHERE sti.transfer_id = :id
                ORDER BY p.name
            """),
            {"id": transfer_id}
        )

        items = [dict(row) for row in result.mappings()]

    return {
        **dict(transfer),
        "items": items
    }


@router.post("/", status_code=201)
def create_stock_transfer(data: StockTransferData):
    if data.from_branch_id == data.to_branch_id:
        raise HTTPException(
            400, "Source and destination branches must be different"
        )

    try:
        with engine.begin() as conn:
            result = conn.execute(
                text("""
                    INSERT INTO stock_transfers (
                        from_branch_id, to_branch_id
                    )
                    VALUES (:from_branch_id, :to_branch_id)
                    RETURNING *
                """),
                data.model_dump()
            )

            transfer = result.mappings().one()

    except IntegrityError:
        raise HTTPException(404, "Branch not found")

    return dict(transfer)


@router.post("/{transfer_id}/items", status_code=201)
def add_transfer_item(
    transfer_id: int,
    data: StockTransferItemData
):
    try:
        with engine.begin() as conn:
            transfer = conn.execute(
                text("""
                    SELECT status
                    FROM stock_transfers
                    WHERE transfer_id = :id
                    FOR UPDATE
                """),
                {"id": transfer_id}
            ).mappings().first()

            if not transfer:
                raise HTTPException(404, "Stock transfer not found")

            if transfer["status"] != "draft":
                raise HTTPException(409, "Transfer is already completed")

            product = conn.execute(
                text("""
                    SELECT 1
                    FROM products
                    WHERE product_id = :id
                    AND is_active = TRUE
                """),
                {"id": data.product_id}
            ).first()

            if not product:
                raise HTTPException(404, "Product not found or inactive")

            result = conn.execute(
                text("""
                    INSERT INTO stock_transfer_items (
                        transfer_id, product_id, quantity
                    )
                    VALUES (:transfer_id, :product_id, :quantity)
                    RETURNING *
                """),
                {"transfer_id": transfer_id, **data.model_dump()}
            )

            item = result.mappings().one()

    except IntegrityError as error:
        if error.orig.sqlstate == "23505":
            raise HTTPException(409, "Product already added to transfer")

        raise HTTPException(400, "Invalid transfer item")

    return dict(item)


@router.post("/{transfer_id}/complete")
def complete_stock_transfer(transfer_id: int):
    with engine.begin() as conn:
        transfer = conn.execute(
            text("""
                SELECT from_branch_id, to_branch_id, status
                FROM stock_transfers
                WHERE transfer_id = :id
                FOR UPDATE
            """),
            {"id": transfer_id}
        ).mappings().first()

        if not transfer:
            raise HTTPException(404, "Stock transfer not found")

        if transfer["status"] != "draft":
            raise HTTPException(409, "Transfer is already completed")

        items = conn.execute(
            text("""
                SELECT product_id, quantity
                FROM stock_transfer_items
                WHERE transfer_id = :id
                ORDER BY product_id
            """),
            {"id": transfer_id}
        ).mappings().all()

        if not items:
            raise HTTPException(400, "Cannot complete an empty transfer")

        for item in items:
            params = {
                "from_branch": transfer["from_branch_id"],
                "to_branch": transfer["to_branch_id"],
                "product_id": item["product_id"],
                "quantity": item["quantity"]
            }

            # Remove stock from the source branch
            result = conn.execute(
                text("""
                    UPDATE inventory
                    SET quantity = quantity - :quantity
                    WHERE branch_id = :from_branch
                      AND product_id = :product_id
                      AND quantity >= :quantity
                    RETURNING quantity
                """),
                params
            )

            if result.first() is None:
                raise HTTPException(
                    409,
                    f"Not enough stock for product {item['product_id']}"
                )

            # Add stock to the destination branch
            conn.execute(
                text("""
                    INSERT INTO inventory (
                        branch_id, product_id, quantity
                    )
                    VALUES (:to_branch, :product_id, :quantity)
                    ON CONFLICT (branch_id, product_id)
                    DO UPDATE SET
                        quantity = inventory.quantity + EXCLUDED.quantity
                """),
                params
            )

        # Mark the transfer as completed
        conn.execute(
            text("""
                UPDATE stock_transfers
                SET status = 'completed',
                    completed_at = NOW()
                WHERE transfer_id = :id
            """),
            {"id": transfer_id}
        )

    return {
        "message": "Stock transfer completed successfully",
        "transfer_id": transfer_id
    }
