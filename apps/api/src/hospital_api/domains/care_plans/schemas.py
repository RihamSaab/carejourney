from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from hospital_api.domains.care_plans.models import CarePlanStatus


class CarePlanRead(BaseModel):
    id: UUID
    patient_id: UUID
    patient_full_name: str
    patient_email: str
    professional_id: UUID
    professional_full_name: str
    title: str
    description: str | None
    start_at: date | None
    end_at: date | None
    status: CarePlanStatus
    created_at: datetime
    updated_at: datetime


class CreateCarePlanRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    patient_email: EmailStr
    title: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    start_at: date | None = None
    end_at: date | None = None
    status: CarePlanStatus = CarePlanStatus.DRAFT

    @model_validator(mode="after")
    def _validate_dates(self) -> "CreateCarePlanRequest":
        if self.start_at and self.end_at and self.start_at > self.end_at:
            raise ValueError("End date must be on or after start date")
        return self


class UpdateCarePlanRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    start_at: date | None = None
    end_at: date | None = None
    status: CarePlanStatus | None = None
