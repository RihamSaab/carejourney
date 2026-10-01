from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from hospital_api.domains.patients.models import Patient
from hospital_api.domains.patients.schemas import PatientRead
from hospital_api.domains.users.models import User


async def get_or_create_for_user(session: AsyncSession, user: User) -> Patient:
    existing = await session.get(Patient, user.id)
    if existing is not None:
        return existing

    patient = Patient(user_id=user.id)
    session.add(patient)
    await session.flush()
    return patient


async def get_for_user(session: AsyncSession, user: User) -> Patient | None:
    return await session.get(Patient, user.id)


async def update_fields(
    session: AsyncSession,
    patient: Patient,
    updates: dict[str, Any],
) -> Patient:
    for field, value in updates.items():
        setattr(patient, field, value)
    await session.flush()
    return patient


def to_read_model(user: User, patient: Patient) -> PatientRead:
    return PatientRead.model_validate(
        {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "date_of_birth": patient.date_of_birth,
            "phone": patient.phone,
            "timezone": patient.timezone,
            "preferred_language": patient.preferred_language,
            "emergency_contact": patient.emergency_contact,
        }
    )
