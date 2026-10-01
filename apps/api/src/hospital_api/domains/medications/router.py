from datetime import date, datetime, timezone
from typing import Annotated, Literal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from hospital_api.core.audit import record_audit
from hospital_api.core.errors import ConflictError, ForbiddenError
from hospital_api.db import get_session
from hospital_api.domains.auth.dependencies import get_current_user
from hospital_api.domains.care_plans.models import CarePlan
from hospital_api.domains.medications import service as medications_service
from hospital_api.domains.medications.dependencies import (
    get_care_plan_for_user,
    get_medication_event_for_patient,
)
from hospital_api.domains.medications.models import (
    Medication,
    MedicationEvent,
    MedicationEventState,
)
from hospital_api.domains.medications.schemas import (
    CreateMedicationRequest,
    MedicationEventRead,
    MedicationRead,
    UpdateMedicationEventRequest,
)
from hospital_api.domains.users.models import User, UserRole

care_plan_medications_router = APIRouter(prefix="/care-plans", tags=["medications"])
medication_events_router = APIRouter(prefix="/medication-events", tags=["medications"])


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def _user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


@care_plan_medications_router.get(
    "/{plan_id}/medications", response_model=list[MedicationRead]
)
async def list_medications(
    current: Annotated[tuple[User, CarePlan], Depends(get_care_plan_for_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[MedicationRead]:
    _, plan = current
    return await medications_service.list_for_care_plan(session, plan.id)


@care_plan_medications_router.post(
    "/{plan_id}/medications",
    response_model=MedicationRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_medication(
    request: Request,
    body: CreateMedicationRequest,
    current: Annotated[tuple[User, CarePlan], Depends(get_care_plan_for_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> MedicationRead:
    user, plan = current
    if user.role != UserRole.PROFESSIONAL or plan.professional_id != user.id:
        raise ForbiddenError("Only the creating professional can add medications.")

    patient_tz = await medications_service.resolve_patient_timezone(session, plan.patient_id)

    medication, event_count = await medications_service.create_medication(
        session,
        care_plan_id=plan.id,
        patient_id=plan.patient_id,
        patient_timezone=patient_tz,
        payload=body,
    )

    await record_audit(
        session,
        action="medication.created",
        actor_user_id=user.id,
        resource_type="medication",
        resource_id=medication.id,
        ip=_client_ip(request),
        user_agent=_user_agent(request),
        metadata={"care_plan_id": str(plan.id), "event_count": event_count},
    )

    await session.commit()
    await session.refresh(medication)
    return MedicationRead.model_validate(
        {
            "id": medication.id,
            "care_plan_id": medication.care_plan_id,
            "patient_id": medication.patient_id,
            "name": medication.name,
            "dosage": medication.dosage,
            "frequency": medication.frequency,
            "start_at": medication.start_at,
            "end_at": medication.end_at,
            "instructions": medication.instructions,
            "created_at": medication.created_at,
        }
    )


@medication_events_router.get("", response_model=list[MedicationEventRead])
async def list_my_events(
    date_param: Annotated[Literal["today"] | str, Query(alias="date")],
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[MedicationEventRead]:
    if current_user.role != UserRole.PATIENT:
        raise ForbiddenError("Only patients see their medication schedule.")

    patient_tz = await medications_service.resolve_patient_timezone(session, current_user.id)

    if date_param == "today":
        tz = ZoneInfo(patient_tz) if _is_valid_tz(patient_tz) else ZoneInfo("UTC")
        target_day = datetime.now(tz=tz).date()
    else:
        try:
            target_day = date.fromisoformat(date_param)
        except ValueError as exc:
            raise ForbiddenError("Invalid date parameter.") from exc

    return await medications_service.list_events_for_patient_on_day(
        session,
        patient_id=current_user.id,
        patient_timezone=patient_tz,
        day=target_day,
    )


@medication_events_router.patch("/{event_id}", response_model=MedicationEventRead)
async def update_event(
    request: Request,
    body: UpdateMedicationEventRequest,
    current: Annotated[
        tuple[User, MedicationEvent, Medication],
        Depends(get_medication_event_for_patient),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> MedicationEventRead:
    user, event, _medication = current

    if event.state != MedicationEventState.SCHEDULED:
        raise ConflictError("This dose has already been recorded.")

    previous_state = event.state.value
    await medications_service.update_event_state(session, event, body.state)

    await record_audit(
        session,
        action="medication_event.state_changed",
        actor_user_id=user.id,
        resource_type="medication_event",
        resource_id=event.id,
        ip=_client_ip(request),
        user_agent=_user_agent(request),
        metadata={"from": previous_state, "to": body.state.value},
    )

    await session.commit()
    dto = await medications_service.get_event_read(session, event.id)
    assert dto is not None
    return dto


def _is_valid_tz(tz_name: str) -> bool:
    try:
        ZoneInfo(tz_name)
    except Exception:
        return False
    _ = timezone.utc
    return True
