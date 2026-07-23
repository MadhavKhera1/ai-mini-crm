from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class AISummary(Base):
    __tablename__ = "ai_summaries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    insights: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    action_items: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    is_outdated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_updated: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    customer = relationship("Customer", back_populates="ai_summary")
