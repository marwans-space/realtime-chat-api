
from core.security import decode_access_token
from sqlalchemy import select
from database.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, Header, HTTPException
from typing import Annotated
from models.user import User

async def get_current_user(
    authorization: Annotated[str, Header()],
    session: AsyncSession = Depends(get_db)
):
    scheme, separator, token = authorization.partition(" ")

    if not separator or scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header"
        )

    try:
        decoded = decode_access_token(token)
        user_id = int(decoded["sub"])
    except (KeyError, ValueError, Exception):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    query = select(User).where(User.id == user_id)
    result = await session.execute(query)
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user
