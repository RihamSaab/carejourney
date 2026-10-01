from typing import Annotated
from uuid import UUID

from fastapi import Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession

from hospital_api.core.errors import ForbiddenError, NotFoundError
from hospital_api.db import get_session
from hospital_api.domains.auth.dependencies import get_current_user
from hospital_api.domains.care_plans import service as care_plans_service
from hospital_api.domains.care_plans.models import CarePlan
from hospital_api.domains.medications import service as medications_service
from hospital_api.domains.medications.models import Medication, MedicationEvent
from hospital_api.domains.users.models import User


async def get_care_plan_for_user(
    plan_id: Annotated[UUID, Path(alias="plan_id")],
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> tuple[User, CarePlan]:
    plan = await care_plans_service.get_plan_entity(session, plan_id)
    if plan is None:
        raise NotFoundError("Care plan not found.")
    if current_user.id not in (plan.patient_id, plan.professional_id):
        raise ForbiddenError("You do not have access to this care plan.")
    return current_user, plan


async def get_medication_event_for_patient(
    event_id: Annotated[UUID, Path(alias="event_id")],
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> tuple[User, MedicationEvent, Medication]:
    event = await medications_service.get_event_entity(session, event_id)
    if event is None:
        raise NotFoundError("Dose not found.")
    if event.patient_id != current_user.id:
        raise ForbiddenError("You cannot update this dose.")

    medication = await session.get(Medication, event.medication_id)
    if medication is None:
        raise NotFoundError("Medication not found.")
    return current_user, event, medication
