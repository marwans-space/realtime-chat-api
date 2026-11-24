from database.base import Base
from sqlalchemy import String, Integer
from sqlalchemy.orm import mapped_column, Mapped

class User(Base):
    __tablename__ = 'users'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False,index=True)
    email: Mapped[str] = mapped_column(String(255),unique=True,nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    