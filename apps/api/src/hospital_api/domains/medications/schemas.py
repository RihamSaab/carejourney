import re
from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from hospital_api.domains.medications.models import MedicationEventState

HHMM = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")


class MedicationFrequency(BaseModel):
    model_config = ConfigDict(extra="forbid")

    times_per_day: int = Field(ge=1, le=6)
    hours: list[str] = Field(min_length=1, max_length=6)

    @model_validator(mode="after")
    def _validate(self) -> "MedicationFrequency":
        if len(self.hours) != self.times_per_day:
            raise ValueError("hours length must match times_per_day")
        for value in self.hours:
            if not HHMM.match(value):
                raise ValueError(f"Invalid HH:MM value: {value}")
        return self


class MedicationRead(BaseModel):
    id: UUID
    care_plan_id: UUID
    patient_id: UUID
    name: str
    dosage: str
    frequency: MedicationFrequency
    start_at: date
    end_at: date | None
    instructions: str | None
    created_at: datetime


class CreateMedicationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=255)
    dosage: str = Field(min_length=1, max_length=128)
    frequency: MedicationFrequency
    start_at: date
    end_at: date | None = None
    instructions: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def _validate_dates(self) -> "CreateMedicationRequest":
        if self.end_at and self.end_at < self.start_at:
            raise ValueError("end_at must be on or after start_at")
        return self


class MedicationEventRead(BaseModel):
    id: UUID
    medication_id: UUID
    medication_name: str
    medication_dosage: str
    patient_id: UUID
    scheduled_at: datetime
    state: MedicationEventState
    acted_at: datetime | None


class UpdateMedicationEventRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    state: MedicationEventState

    @model_validator(mode="after")
    def _not_scheduled(self) -> "UpdateMedicationEventRequest":
        if self.state == MedicationEventState.SCHEDULED:
            raise ValueError("Cannot transition back to scheduled")
        return self
