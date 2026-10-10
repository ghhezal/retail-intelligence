
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.database import engine
from app.schemas import InventoryData, InventoryUpdate

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("/")
def get_inventory(
    branch_id: int | None = None,
    search: str | None = None,
    low_stock_only: bool = False
):
    query = """
        SELECT
            i.branch_id,
            i.product_id,
            b.name AS branch,
            p.name AS product,
            p.sku,
            i.quantity,
            i.reorder_level,
            (i.quantity <= i.reorder_level) AS low_stock
        FROM inventory i
        JOIN branches b ON i.branch_id = b.branch_id
        JOIN products p ON i.product_id = p.product_id
        WHERE 1=1
    """

    params = {}

    if branch_id is not None:
        query += " AND i.branch_id = :branch_id"
        params["branch_id"] = branch_id

    if search:
        query += " AND (p.name ILIKE :search OR p.sku ILIKE :search)"
        params["search"] = f"%{search}%"

    if low_stock_only:
        query += " AND i.quantity <= i.reorder_level"

    query += " ORDER BY b.name, p.name"

    with engine.connect() as conn:
        result = conn.execute(text(query), params)
        return [dict(row) for row in result.mappings()]


@router.get("/{branch_id}/{product_id}")
def get_inventory_item(branch_id: int, product_id: int):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT *
                FROM inventory
                WHERE branch_id = :branch_id
                AND product_id = :product_id
            """),
            {"branch_id": branch_id, "product_id": product_id}
        )
        item = result.mappings().first()

    if not item:
        raise HTTPException(404, "Inventory record not found")

    return dict(item)


@router.post("/", status_code=201)
def create_inventory(data: InventoryData):
    try:
        with engine.begin() as conn:
            result = conn.execute(
                text("""
                    INSERT INTO inventory (
                        branch_id, product_id, quantity, reorder_level
                    )
                    VALUES (
                        :branch_id, :product_id, :quantity, :reorder_level
                    )
                    RETURNING *
                """),
                data.model_dump()
            )
            item = result.mappings().one()

        return dict(item)

    except IntegrityError as error:
        if error.orig.sqlstate == "23505":
            raise HTTPException(
                409, "Inventory already exists for this product and branch"
            )

        if error.orig.sqlstate == "23503":
            raise HTTPException(
                404, "Branch or product not found"
            )

        raise HTTPException(400, "Invalid inventory data")


@router.put("/{branch_id}/{product_id}")
def update_inventory(
    branch_id: int,
    product_id: int,
    data: InventoryUpdate
):
    with engine.begin() as conn:
        result = conn.execute(
            text("""
                UPDATE inventory
                SET
                    quantity = :quantity,
                    reorder_level = :reorder_level
                WHERE branch_id = :branch_id
                AND product_id = :product_id
                RETURNING *
            """),
            {
                **data.model_dump(),
                "branch_id": branch_id,
                "product_id": product_id
            }
        )
        item = result.mappings().first()

    if not item:
        raise HTTPException(404, "Inventory record not found")

    return dict(item)
