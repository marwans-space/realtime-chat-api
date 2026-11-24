from fastapi import APIRouter, HTTPException, Depends
from schemas.auth import UserLogin, UserRegister
from core.security import hash_password,verify_password,create_access_token
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from database.session import get_db
from models.user import User
from dependencies.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Register
@router.post("/register",status_code=201)
async def register(body: UserRegister, session: AsyncSession = Depends(get_db)):
        query = select(User).where(or_(
                User.username == body.username, User.email == body.email
            ))
        result = await session.execute(query)
        existing_user = result.scalar_one_or_none()
        if existing_user != None:
            raise HTTPException(status_code=409,detail="Username or email already exists")
        password_hash = hash_password(body.password)
        new_user = User(username=body.username, email=body.email,password_hash=password_hash)
        session.add(new_user)
        await session.commit()
        token = create_access_token(new_user.id)
        return {
            "access_token": token,
            "token_type": "bearer"
        }

# Login
@router.post("/login")
async def login(body: UserLogin, session: AsyncSession = Depends(get_db)):
    query = select(User).where(or_(User.username == body.identifier, User.email == body.identifier))
    result = await session.execute(query)
    existing_user = result.scalar_one_or_none()
    if not existing_user:
        raise HTTPException(
    status_code=401,
    detail="Invalid username/email or password"
)
    if not verify_password(body.password, existing_user.password_hash):
        raise HTTPException(
    status_code=401,
    detail="Invalid username/email or password"
)
    token = create_access_token(existing_user.id)
    return {
        "access_token": token,
        "token_type": "bearer"
    }

# Me!
@router.get("/me")
async def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }
