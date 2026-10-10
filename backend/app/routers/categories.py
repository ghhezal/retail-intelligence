
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.database import engine
from app.schemas import CategoryData

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/")
def get_categories():
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM categories ORDER BY name")
        )
        return [dict(row) for row in result.mappings()]


@router.get("/{category_id}")
def get_category(category_id: int):
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM categories WHERE category_id = :id"),
            {"id": category_id}
        )
        category = result.mappings().first()

    if not category:
        raise HTTPException(404, "Category not found")

    return dict(category)


@router.post("/", status_code=201)
def create_category(data: CategoryData):
    try:
        with engine.begin() as conn:
            result = conn.execute(
                text("""
                    INSERT INTO categories (name, description)
                    VALUES (:name, :description)
                    RETURNING category_id
                """),
                data.model_dump()
            )
            category_id = result.scalar_one()

    except IntegrityError:
        raise HTTPException(409, "Category already exists")

    return get_category(category_id)


@router.put("/{category_id}")
def update_category(category_id: int, data: CategoryData):
    try:
        with engine.begin() as conn:
            result = conn.execute(
                text("""
                    UPDATE categories
                    SET name = :name, description = :description
                    WHERE category_id = :id
                    RETURNING category_id
                """),
                {**data.model_dump(), "id": category_id}
            )
            updated_id = result.scalar_one_or_none()

    except IntegrityError:
        raise HTTPException(409, "Category name already exists")

    if updated_id is None:
        raise HTTPException(404, "Category not found")

    return get_category(updated_id)


@router.delete("/{category_id}")
def delete_category(category_id: int):
    try:
        with engine.begin() as conn:
            result = conn.execute(
                text("""
                    DELETE FROM categories
                    WHERE category_id = :id
                    RETURNING category_id
                """),
                {"id": category_id}
            )
            deleted_id = result.scalar_one_or_none()

    except IntegrityError:
        raise HTTPException(
            409,
            "Cannot delete a category used by products"
        )

    if deleted_id is None:
        raise HTTPException(404, "Category not found")

    return {"message": "Category deleted"}
