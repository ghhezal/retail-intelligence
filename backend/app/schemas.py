from decimal import Decimal
from pydantic import BaseModel, Field


class CategoryData(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None


class ProductData(BaseModel):
    category_id: int = Field(gt=0)
    brand_id: int = Field(gt=0)
    sku: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    cost_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    selling_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)


class BrandData(BaseModel):
    name: str = Field(min_length=1, max_length=100)