
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.database import engine
from app.schemas import ProductData

router = APIRouter(prefix="/products", tags=["Products"])


product_query = """
    SELECT
        p.*,
        c.name AS category,
        b.name AS brand
    FROM products p
    JOIN categories c ON p.category_id = c.category_id
    JOIN brands b ON p.brand_id = b.brand_id
"""


@router.get("/")
def get_products(
    search: str | None = None,
    category_id: int | None = None,
    brand_id: int | None = None,
    include_inactive: bool = False,
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    query = product_query + " WHERE 1=1"
    params = {"limit": limit, "offset": offset}

    if not include_inactive:
        query += " AND p.is_active = TRUE"

    if search:
        query += """
            AND (p.name ILIKE :search OR p.sku ILIKE :search)
        """
        params["search"] = f"%{search}%"

    if category_id is not None:
        query += " AND p.category_id = :category_id"
        params["category_id"] = category_id

    if brand_id is not None:
        query += " AND p.brand_id = :brand_id"
        params["brand_id"] = brand_id

    query += " ORDER BY p.product_id LIMIT :limit OFFSET :offset"

    with engine.connect() as conn:
        result = conn.execute(text(query), params)
        return [dict(row) for row in result.mappings()]


@router.get("/{product_id}")
def get_product(product_id: int):
    with engine.connect() as conn:
        result = conn.execute(
            text(product_query + " WHERE p.product_id = :id"),
            {"id": product_id}
        )
        product = result.mappings().first()

    if not product:
        raise HTTPException(404, "Product not found")

    return dict(product)


@router.post("/", status_code=201)
def create_product(data: ProductData):
    try:
        with engine.begin() as conn:
            result = conn.execute(
                text("""
                    INSERT INTO products (
                        category_id, brand_id, sku, name,
                        description, cost_price, selling_price
                    )
                    VALUES (
                        :category_id, :brand_id, :sku, :name,
                        :description, :cost_price, :selling_price
                    )
                    RETURNING product_id
                """),
                data.model_dump()
            )
            product_id = result.scalar_one()

    except IntegrityError as error:
        if error.orig.sqlstate == "23505":
            raise HTTPException(409, "Product SKU already exists")
        raise HTTPException(400, "Invalid product data or IDs")

    return get_product(product_id)


@router.put("/{product_id}")
def update_product(product_id: int, data: ProductData):
    try:
        with engine.begin() as conn:
            result = conn.execute(
                text("""
                    UPDATE products
                    SET
                        category_id = :category_id,
                        brand_id = :brand_id,
                        sku = :sku,
                        name = :name,
                        description = :description,
                        cost_price = :cost_price,
                        selling_price = :selling_price
                    WHERE product_id = :id
                    RETURNING product_id
                """),
                {**data.model_dump(), "id": product_id}
            )
            updated_id = result.scalar_one_or_none()

    except IntegrityError as error:
        if error.orig.sqlstate == "23505":
            raise HTTPException(409, "Product SKU already exists")
        raise HTTPException(400, "Invalid product data or IDs")

    if updated_id is None:
        raise HTTPException(404, "Product not found")

    return get_product(updated_id)


@router.delete("/{product_id}")
def delete_product(product_id: int):
    with engine.begin() as conn:
        result = conn.execute(
            text("""
                UPDATE products
                SET is_active = FALSE
                WHERE product_id = :id
                RETURNING product_id
            """),
            {"id": product_id}
        )
        deleted_id = result.scalar_one_or_none()

    if deleted_id is None:
        raise HTTPException(404, "Product not found")

    return {"message": "Product deactivated"}
