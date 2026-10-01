from datetime import date
from typing import Any
from uuid import UUID

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from hospital_api.db import Base, TimestampMixin


class Patient(Base, TimestampMixin):
    __tablename__ = "patients"

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC")
    preferred_language: Mapped[str] = mapped_column(String(8), nullable=False, default="en")
    emergency_contact: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
