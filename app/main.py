from contextlib import asynccontextmanager
from fastapi import FastAPI
from routers.health import router as health_router
from routers.auth import router as auth_router
from routers.chat import router as chat_router
from database.session import engine
from sqlalchemy import text

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.connect() as connection:
            result = await  connection.execute(text("SELECT 1"))
            print(f"Database connection successful! Result: {result.scalar()}")
    except Exception as e:
        print(f"Database connection error: {e}")
        raise
    yield
    await engine.dispose()

app = FastAPI(title="Realtime Chat API",
              description="A real-time messaging API built with FastAPI",
              version="0.1.0",
              lifespan=lifespan)


@app.get("/")
async def root():
    return {"message": "Welcome to Realtime Chat API"}
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(chat_router)