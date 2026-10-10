from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.database import engine

router = APIRouter(prefix="/branches", tags=["Branches"])


@router.get("/")
def get_branches():
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM branches ORDER BY branch_id")
        )
        return [dict(row) for row in result.mappings()]


@router.get("/{branch_id}")
def get_branch(branch_id: int):
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM branches WHERE branch_id = :id"),
            {"id": branch_id}
        )
        branch = result.mappings().first()

    if not branch:
        raise HTTPException(404, "Branch not found")

    return dict(branch)