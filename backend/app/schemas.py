from decimal import Decimal
from pydantic import BaseModel, Field
from typing import Literal


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


class InventoryData(BaseModel):
    branch_id: int = Field(gt=0)
    product_id: int = Field(gt=0)
    quantity: int = Field(ge=0)
    reorder_level: int = Field(ge=0)


class InventoryUpdate(BaseModel):
    quantity: int = Field(ge=0)
    reorder_level: int = Field(ge=0)


class SupplierData(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    email: str | None = None
    phone: str | None = None
    address: str | None = None


class SupplierProductData(BaseModel):
    product_id: int = Field(gt=0)
    supplier_sku: str | None = None
    supplier_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)


class PurchaseOrderData(BaseModel):
    supplier_id: int = Field(gt=0)
    branch_id: int = Field(gt=0)


class PurchaseOrderItemData(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)


class SaleItemData(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)


class SaleData(BaseModel):
    branch_id: int = Field(gt=0)
    customer_id: int | None = Field(default=None, gt=0)
    payment_method: Literal["cash", "card", "bank_transfer"]
    items: list[SaleItemData] = Field(min_length=1)


class StockTransferData(BaseModel):
    from_branch_id: int = Field(gt=0)
    to_branch_id: int = Field(gt=0)


class StockTransferItemData(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)