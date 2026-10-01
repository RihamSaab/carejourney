from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from hospital_api.core.errors import ForbiddenError
from hospital_api.db import get_session
from hospital_api.domains.auth.dependencies import get_current_user
from hospital_api.domains.patients import service as patients_service
from hospital_api.domains.patients.models import Patient
from hospital_api.domains.users.models import User, UserRole


async def get_current_patient(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> tuple[User, Patient]:
    if current_user.role != UserRole.PATIENT:
        raise ForbiddenError("This endpoint is only available for patient accounts.")

    patient = await patients_service.get_for_user(session, current_user)
    if patient is None:
        patient = await patients_service.get_or_create_for_user(session, current_user)

    return current_user, patient
