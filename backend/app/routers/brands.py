from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.database import engine
from app.schemas import BrandData

router = APIRouter(prefix="/brands", tags=["Brands"])


@router.get("/")
def get_brands():
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM brands ORDER BY name")
        )
        return [dict(row) for row in result.mappings()]


@router.post("/", status_code=201)
def create_brand(data: BrandData):
    try:
        with engine.begin() as conn:
            result = conn.execute(
                text("""
                    INSERT INTO brands (name)
                    VALUES (:name)
                    RETURNING brand_id, name
                """),
                data.model_dump()
            )
            brand = result.mappings().one()

        return dict(brand)

    except IntegrityError:
        raise HTTPException(409, "Brand already exists")