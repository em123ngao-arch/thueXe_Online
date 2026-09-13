from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.user import Role, User
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])
admin_router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    return current_user


@admin_router.get("/users", response_model=list[UserResponse])
async def list_users(
    _: Annotated[User, Depends(require_roles([Role.ADMIN]))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[User]:
    result = await db.scalars(select(User).order_by(User.created_at.desc()))
    return list(result.all())
