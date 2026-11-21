from core.config import get_settings
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, sessionmaker

database_url = get_settings().database_url.get_secret_value()

engine = create_async_engine(database_url,echo=True)
SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False,)

async def get_db():
    async with SessionLocal() as session:
        yield session