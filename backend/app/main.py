from fastapi import FastAPI
from sqlalchemy import text

from app.database import engine
from app.routers import products, categories, brands

app = FastAPI(title="Retail Intelligence API")

app.include_router(products.router)
app.include_router(categories.router)
app.include_router(brands.router)


@app.get("/")
def home():
    return {"message": "Retail Intelligence API is running"}


@app.get("/db-check")
def check_database():
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT COUNT(*) FROM products")
        )

        total_products = result.scalar_one()

    return {
        "database": "connected",
        "products": total_products
    }