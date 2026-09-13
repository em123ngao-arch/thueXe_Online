from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import Token, UserLogin, UserRegister, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    if not user_data.is_self_registerable_role():
        raise HTTPException(status_code=400, detail="Only CUSTOMER or OWNER can self-register")

    existing_user = await db.scalar(select(User).where(User.email == user_data.email.lower()))
    if existing_user:
        raise HTTPException(status_code=409, detail="Email is already registered")

    user = User(
        email=user_data.email.lower(),
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        phone_number=user_data.phone_number,
        role=user_data.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Token:
    user = await db.scalar(select(User).where(User.email == credentials.email.lower()))
    if user is None or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    token = create_access_token(subject=user.id, role=user.role.value)
    return Token(access_token=token)


@router.post("/refresh-token", response_model=Token)
async def refresh_token() -> Token:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Refresh tokens are not enabled yet")
