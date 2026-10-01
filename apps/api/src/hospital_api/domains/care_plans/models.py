import enum
from datetime import date
from uuid import UUID

from sqlalchemy import Date, Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from hospital_api.db import Base, TimestampMixin, UUIDPrimaryKeyMixin


class CarePlanStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CarePlan(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "care_plans"
    __table_args__ = (
        Index("ix_care_plans_patient_id", "patient_id"),
        Index("ix_care_plans_professional_id", "professional_id"),
    )

    patient_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    professional_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[CarePlanStatus] = mapped_column(
        Enum(CarePlanStatus, name="care_plan_status", native_enum=False, length=32),
        nullable=False,
        default=CarePlanStatus.DRAFT,
    )
