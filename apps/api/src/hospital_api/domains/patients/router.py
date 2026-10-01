from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from hospital_api.core.audit import record_audit
from hospital_api.db import get_session
from hospital_api.domains.patients import service as patients_service
from hospital_api.domains.patients.dependencies import get_current_patient
from hospital_api.domains.patients.models import Patient
from hospital_api.domains.patients.schemas import PatientRead, PatientUpdate
from hospital_api.domains.users.models import User

router = APIRouter(prefix="/patients", tags=["patients"])


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def _user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


@router.get("/me", response_model=PatientRead)
async def read_me(
    current: Annotated[tuple[User, Patient], Depends(get_current_patient)],
) -> PatientRead:
    user, patient = current
    return patients_service.to_read_model(user, patient)


@router.patch("/me", response_model=PatientRead)
async def update_me(
    request: Request,
    body: PatientUpdate,
    current: Annotated[tuple[User, Patient], Depends(get_current_patient)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> PatientRead:
    user, patient = current

    changes_raw = body.model_dump(exclude_unset=True)
    changes: dict[str, object] = {}
    for field, value in changes_raw.items():
        if field == "emergency_contact" and isinstance(value, dict):
            changes[field] = value
        else:
            changes[field] = value

    if changes:
        await patients_service.update_fields(session, patient, changes)
        await record_audit(
            session,
            action="patient.profile_updated",
            actor_user_id=user.id,
            resource_type="patient",
            resource_id=user.id,
            ip=_client_ip(request),
            user_agent=_user_agent(request),
            metadata={"fields": sorted(changes.keys())},
        )

    await session.commit()
    await session.refresh(patient)
    return patients_service.to_read_model(user, patient)
