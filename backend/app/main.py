from fastapi import FastAPI
from sqlalchemy import text
from app.database import engine

app = FastAPI(title="Retail Intelligence API")


@app.get("/")
def home():
    return {"message": "Retail Intelligence API is running"}


@app.get("/db-check")
def check_database():
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT COUNT(*) FROM products")
        )
        total_products = result.scalar_one()

    return {
        "database": "connected",
        "products": total_products
    }