from datetime import datetime, timezone
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from hospital_api.core.audit import record_audit
from hospital_api.core.errors import AppError, ForbiddenError
from hospital_api.db import get_session
from hospital_api.domains.appointments import service as appointments_service
from hospital_api.domains.appointments.dependencies import (
    get_appointment_for_user,
    get_care_plan_for_user,
)
from hospital_api.domains.appointments.models import Appointment, AppointmentStatus
from hospital_api.domains.appointments.schemas import (
    AppointmentRead,
    CreateAppointmentRequest,
    UpdateAppointmentRequest,
)
from hospital_api.domains.auth.dependencies import get_current_user
from hospital_api.domains.care_plans.models import CarePlan
from hospital_api.domains.users.models import User, UserRole

care_plan_appointments_router = APIRouter(prefix="/care-plans", tags=["appointments"])
appointments_router = APIRouter(prefix="/appointments", tags=["appointments"])


class _InvalidTransitionError(AppError):
    status_code = 422
    error_code = "invalid_transition"
    message = "Invalid status transition for this appointment."


class _PatientFieldForbiddenError(AppError):
    status_code = 422
    error_code = "patient_cannot_edit_fields"
    message = "Patients may only change appointment status."


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def _user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


@care_plan_appointments_router.get(
    "/{plan_id}/appointments", response_model=list[AppointmentRead]
)
async def list_appointments(
    current: Annotated[tuple[User, CarePlan], Depends(get_care_plan_for_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[AppointmentRead]:
    _, plan = current
    return await appointments_service.list_for_care_plan(
        session, care_plan_id=plan.id, now=_utcnow()
    )


@care_plan_appointments_router.post(
    "/{plan_id}/appointments",
    response_model=AppointmentRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_appointment(
    request: Request,
    body: CreateAppointmentRequest,
    current: Annotated[tuple[User, CarePlan], Depends(get_care_plan_for_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AppointmentRead:
    user, plan = current

    appt = await appointments_service.create_appointment(
        session,
        care_plan=plan,
        created_by_role=user.role.value,
        title=body.title,
        description=body.description,
        scheduled_at=body.scheduled_at,
        duration_minutes=body.duration_minutes,
        location_kind=body.location_kind,
        location_detail=body.location_detail,
    )

    await record_audit(
        session,
        action="appointment.created",
        actor_user_id=user.id,
        resource_type="appointment",
        resource_id=appt.id,
        ip=_client_ip(request),
        user_agent=_user_agent(request),
        metadata={
            "care_plan_id": str(plan.id),
            "patient_id": str(plan.patient_id),
            "scheduled_at": body.scheduled_at.isoformat(),
            "duration_minutes": body.duration_minutes,
            "location_kind": body.location_kind.value,
            "initial_status": appt.status.value,
        },
    )

    await session.commit()
    dto = await appointments_service.get_appointment_read(session, appt.id, _utcnow())
    assert dto is not None
    return dto


@appointments_router.get("", response_model=list[AppointmentRead])
async def list_upcoming_appointments(
    _scope: Annotated[Literal["upcoming"], Query(alias="scope")],
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[AppointmentRead]:
    if current_user.role != UserRole.PATIENT:
        raise ForbiddenError("Only patients can view their upcoming appointments.")
    return await appointments_service.list_upcoming_for_patient(
        session, patient_id=current_user.id, now=_utcnow()
    )


@appointments_router.patch("/{appointment_id}", response_model=AppointmentRead)
async def update_appointment(
    request: Request,
    body: UpdateAppointmentRequest,
    current: Annotated[tuple[User, Appointment], Depends(get_appointment_for_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AppointmentRead:
    user, appt = current
    is_professional = (
        user.role == UserRole.PROFESSIONAL and user.id == appt.professional_id
    )
    is_patient = user.role == UserRole.PATIENT and user.id == appt.patient_id

    if not is_professional and not is_patient:
        raise ForbiddenError("You cannot update this appointment.")

    updates = body.model_dump(exclude_unset=True)

    non_status_fields = {
        "title",
        "description",
        "scheduled_at",
        "duration_minutes",
        "location_kind",
        "location_detail",
    }
    touching_non_status = any(field in updates for field in non_status_fields)

    if is_patient and not is_professional and touching_non_status:
        raise _PatientFieldForbiddenError()

    if "status" in updates:
        requested_status = updates["status"]
        if requested_status != appt.status:
            allowed = (
                appointments_service.PROFESSIONAL_TRANSITIONS[appt.status]
                if is_professional
                else appointments_service.PATIENT_TRANSITIONS[appt.status]
            )
            if requested_status not in allowed:
                raise _InvalidTransitionError(
                    f"Cannot move appointment from {appt.status.value} to {requested_status.value}."
                )

    previous_status = appt.status
    await appointments_service.apply_updates(session, appt, updates)

    audit_metadata: dict[str, object] = {"fields": sorted(updates.keys())}
    if "status" in updates and updates["status"] != previous_status:
        new_status = updates["status"]
        audit_metadata["from"] = previous_status.value
        audit_metadata["to"] = (
            new_status.value if isinstance(new_status, AppointmentStatus) else str(new_status)
        )

    await record_audit(
        session,
        action="appointment.updated",
        actor_user_id=user.id,
        resource_type="appointment",
        resource_id=appt.id,
        ip=_client_ip(request),
        user_agent=_user_agent(request),
        metadata=audit_metadata,
    )

    await session.commit()
    dto = await appointments_service.get_appointment_read(session, appt.id, _utcnow())
    assert dto is not None
    return dto
