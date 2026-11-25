from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, Query
from routers.health import router as health_router
from routers.auth import router as auth_router
from routers.chat import router as chat_router
from routers.websocket import router as socket_router
from database.session import engine, get_db
from dependencies.auth import get_current_user
from models.user import User
from schemas.users import UserSearchResult
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.connect() as connection:
            result = await connection.execute(text("SELECT 1"))
            print(f"Database connection successful! Result: {result.scalar()}")
    except Exception as e:
        print(f"Database connection error: {e}")
        raise
    yield
    await engine.dispose()


app = FastAPI(
    title="Realtime Chat API",
    description="A real-time messaging API built with FastAPI",
    version="0.1.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Welcome to Realtime Chat API"}


@app.get("/users/search", response_model=list[UserSearchResult])
async def search_users(
    q: str = Query(..., min_length=1, max_length=50),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    search_term = q.strip()
    if not search_term:
        raise HTTPException(status_code=422, detail="Search query cannot be blank")

    escaped_term = (
        search_term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    )
    result = await session.execute(
        select(User.id, User.username)
        .where(
            User.id != current_user.id,
            User.username.ilike(f"%{escaped_term}%", escape="\\"),
        )
        .order_by(User.username)
        .limit(20)
    )
    return [
        UserSearchResult(id=user_id, username=username)
        for user_id, username in result.all()
    ]


app.include_router(health_router)
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(socket_router)
