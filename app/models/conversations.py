
import datetime

from database.base import Base
from sqlalchemy import CheckConstraint, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import mapped_column, Mapped


class Conversation(Base):
    __tablename__ = "conversations"
    __table_args__ = (
    CheckConstraint("user1_id != user2_id", name="check_different_users"),
    UniqueConstraint("user1_id", "user2_id", name="unique_conversation_pair"),
)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    user1_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    user2_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False
    )
