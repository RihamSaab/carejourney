from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import Select, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from hospital_api.domains.appointments.models import (
    Appointment,
    AppointmentLocationKind,
    AppointmentStatus,
)
from hospital_api.domains.appointments.schemas import AppointmentRead
from hospital_api.domains.care_plans.models import CarePlan

AppointmentRow = tuple[Appointment, str]

PATIENT_TRANSITIONS: dict[AppointmentStatus, set[AppointmentStatus]] = {
    AppointmentStatus.REQUESTED: {AppointmentStatus.CANCELLED},
    AppointmentStatus.SCHEDULED: {AppointmentStatus.CANCELLED},
    AppointmentStatus.COMPLETED: set(),
    AppointmentStatus.CANCELLED: set(),
    AppointmentStatus.NO_SHOW: set(),
}

PROFESSIONAL_TRANSITIONS: dict[AppointmentStatus, set[AppointmentStatus]] = {
    AppointmentStatus.REQUESTED: {AppointmentStatus.SCHEDULED, AppointmentStatus.CANCELLED},
    AppointmentStatus.SCHEDULED: {
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
    },
    AppointmentStatus.COMPLETED: {AppointmentStatus.SCHEDULED},
    AppointmentStatus.CANCELLED: {AppointmentStatus.REQUESTED, AppointmentStatus.SCHEDULED},
    AppointmentStatus.NO_SHOW: {AppointmentStatus.SCHEDULED},
}

TERMINAL_STATUSES: set[AppointmentStatus] = {
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
}


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


def _row_to_dto(row: AppointmentRow, now: datetime) -> AppointmentRead:
    appt, care_plan_title = row
    is_past = appt.status not in TERMINAL_STATUSES and appt.scheduled_at < now
    return AppointmentRead(
        id=appt.id,
        care_plan_id=appt.care_plan_id,
        care_plan_title=care_plan_title,
        patient_id=appt.patient_id,
        professional_id=appt.professional_id,
        title=appt.title,
        description=appt.description,
        scheduled_at=appt.scheduled_at,
        duration_minutes=appt.duration_minutes,
        location_kind=appt.location_kind,
        location_detail=appt.location_detail,
        status=appt.status,
        is_past=is_past,
        created_at=appt.created_at,
        updated_at=appt.updated_at,
    )


def _base_select() -> Select[AppointmentRow]:
    return select(Appointment, CarePlan.title).join(
        CarePlan, CarePlan.id == Appointment.care_plan_id
    )


async def list_for_care_plan(
    session: AsyncSession,
    *,
    care_plan_id: UUID,
    now: datetime,
) -> list[AppointmentRead]:
    stmt = (
        _base_select()
        .where(Appointment.care_plan_id == care_plan_id)
        .order_by(Appointment.scheduled_at.asc(), Appointment.created_at.desc())
    )
    result = await session.execute(stmt)
    return [_row_to_dto(row, now) for row in result.tuples().all()]


async def list_upcoming_for_patient(
    session: AsyncSession,
    *,
    patient_id: UUID,
    now: datetime,
) -> list[AppointmentRead]:
    stmt = (
        _base_select()
        .where(
            Appointment.patient_id == patient_id,
            or_(
                Appointment.status == AppointmentStatus.REQUESTED,
                Appointment.status == AppointmentStatus.SCHEDULED,
            ),
        )
        .order_by(Appointment.scheduled_at.asc())
    )
    result = await session.execute(stmt)
    return [_row_to_dto(row, now) for row in result.tuples().all()]


async def get_appointment_entity(
    session: AsyncSession, appointment_id: UUID
) -> Appointment | None:
    return await session.get(Appointment, appointment_id)


async def get_appointment_read(
    session: AsyncSession, appointment_id: UUID, now: datetime
) -> AppointmentRead | None:
    stmt = _base_select().where(Appointment.id == appointment_id)
    result = await session.execute(stmt)
    row = result.tuples().first()
    if row is None:
        return None
    return _row_to_dto(row, now)


async def create_appointment(
    session: AsyncSession,
    *,
    care_plan: CarePlan,
    created_by_role: str,
    title: str,
    description: str | None,
    scheduled_at: datetime,
    duration_minutes: int,
    location_kind: AppointmentLocationKind,
    location_detail: str | None,
) -> Appointment:
    initial_status = (
        AppointmentStatus.REQUESTED if created_by_role == "patient" else AppointmentStatus.SCHEDULED
    )
    appt = Appointment(
        care_plan_id=care_plan.id,
        patient_id=care_plan.patient_id,
        professional_id=care_plan.professional_id,
        title=title,
        description=description,
        scheduled_at=scheduled_at,
        duration_minutes=duration_minutes,
        location_kind=location_kind,
        location_detail=location_detail,
        status=initial_status,
    )
    session.add(appt)
    await session.flush()
    return appt


async def apply_updates(
    session: AsyncSession,
    appt: Appointment,
    updates: dict[str, object],
) -> Appointment:
    for field, value in updates.items():
        setattr(appt, field, value)
    await session.flush()
    return appt
