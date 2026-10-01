from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from hospital_api.domains.appointments.models import (
    AppointmentLocationKind,
    AppointmentStatus,
)


class AppointmentRead(BaseModel):
    id: UUID
    care_plan_id: UUID
    care_plan_title: str
    patient_id: UUID
    professional_id: UUID
    title: str
    description: str | None
    scheduled_at: datetime
    duration_minutes: int
    location_kind: AppointmentLocationKind
    location_detail: str | None
    status: AppointmentStatus
    is_past: bool
    created_at: datetime
    updated_at: datetime


class CreateAppointmentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    scheduled_at: datetime
    duration_minutes: int = Field(ge=5, le=480)
    location_kind: AppointmentLocationKind = AppointmentLocationKind.IN_PERSON
    location_detail: str | None = Field(default=None, max_length=500)


class UpdateAppointmentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    scheduled_at: datetime | None = None
    duration_minutes: int | None = Field(default=None, ge=5, le=480)
    location_kind: AppointmentLocationKind | None = None
    location_detail: str | None = Field(default=None, max_length=500)
    status: AppointmentStatus | None = None
