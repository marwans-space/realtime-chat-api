from contextlib import asynccontextmanager
from fastapi import FastAPI
from routers.health import router as health_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    pass
    yield
    pass

app = FastAPI(title="Realtime Chat API",
              description="A real-time messaging API built with FastAPI",
              version="0.1.0",
              lifespan=lifespan)


@app.get("/")
async def root():
    return {"message": "Welcome to Realtime Chat API"}
app.include_router(health_router)