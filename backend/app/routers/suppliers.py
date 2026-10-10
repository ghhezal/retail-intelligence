
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.database import engine
from app.schemas import SupplierData, SupplierProductData

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


@router.get("/")
def get_suppliers():
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM suppliers ORDER BY name")
        )
        return [dict(row) for row in result.mappings()]


@router.post("/", status_code=201)
def create_supplier(data: SupplierData):
    with engine.begin() as conn:
        result = conn.execute(
            text("""
                INSERT INTO suppliers (name, email, phone, address)
                VALUES (:name, :email, :phone, :address)
                RETURNING *
            """),
            data.model_dump()
        )
        supplier = result.mappings().one()

    return dict(supplier)


@router.put("/{supplier_id}")
def update_supplier(supplier_id: int, data: SupplierData):
    with engine.begin() as conn:
        result = conn.execute(
            text("""
                UPDATE suppliers
                SET name = :name,
                    email = :email,
                    phone = :phone,
                    address = :address
                WHERE supplier_id = :id
                RETURNING *
            """),
            {**data.model_dump(), "id": supplier_id}
        )
        supplier = result.mappings().first()

    if not supplier:
        raise HTTPException(404, "Supplier not found")

    return dict(supplier)


@router.get("/{supplier_id}/products")
def get_supplier_products(supplier_id: int):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT
                    p.product_id,
                    p.name,
                    p.sku,
                    sp.supplier_price
                FROM supplier_products sp
                JOIN products p ON sp.product_id = p.product_id
                WHERE sp.supplier_id = :id
                ORDER BY p.name
            """),
            {"id": supplier_id}
        )
        return [dict(row) for row in result.mappings()]


@router.post("/{supplier_id}/products", status_code=201)
def add_supplier_product(supplier_id: int, data: SupplierProductData):
    try:
        with engine.begin() as conn:
            result = conn.execute(
                text("""
                    INSERT INTO supplier_products (
                        supplier_id, product_id,
                        supplier_sku, supplier_price
                    )
                    VALUES (
                        :supplier_id, :product_id,
                        :supplier_sku, :supplier_price
                    )
                    RETURNING *
                """),
                {"supplier_id": supplier_id, **data.model_dump()}
            )
            item = result.mappings().one()

    except IntegrityError as error:
        if error.orig.sqlstate == "23505":
            raise HTTPException(409, "Supplier already offers this product")

        if error.orig.sqlstate == "23503":
            raise HTTPException(404, "Supplier or product not found")

        raise HTTPException(400, "Invalid supplier product data")

    return dict(item)
