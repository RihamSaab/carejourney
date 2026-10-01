from datetime import date
from uuid import UUID
from zoneinfo import available_timezones

from pydantic import BaseModel, ConfigDict, Field, field_validator

from hospital_api.domains.users.models import UserRole

_LANGUAGE_CODES = {"en", "ar"}


class EmergencyContact(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=3, max_length=32)
    relationship: str = Field(min_length=1, max_length=64)


class PatientRead(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: UserRole
    date_of_birth: date | None
    phone: str | None
    timezone: str
    preferred_language: str
    emergency_contact: EmergencyContact | None


class PatientUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date_of_birth: date | None = None
    phone: str | None = Field(default=None, max_length=32)
    timezone: str | None = None
    preferred_language: str | None = None
    emergency_contact: EmergencyContact | None = None

    @field_validator("timezone")
    @classmethod
    def _validate_timezone(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if value not in available_timezones():
            raise ValueError(f"Unknown timezone: {value}")
        return value

    @field_validator("preferred_language")
    @classmethod
    def _validate_language(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if value not in _LANGUAGE_CODES:
            raise ValueError(f"Unsupported language: {value}")
        return value
