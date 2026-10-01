from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from hospital_api.domains.medications.materialize import materialize_events
from hospital_api.domains.medications.models import (
    Medication,
    MedicationEvent,
    MedicationEventState,
)
from hospital_api.domains.medications.schemas import (
    CreateMedicationRequest,
    MedicationEventRead,
    MedicationFrequency,
    MedicationRead,
)
from hospital_api.domains.patients.models import Patient

EventRow = tuple[MedicationEvent, str, str]


def _medication_to_read(medication: Medication) -> MedicationRead:
    return MedicationRead(
        id=medication.id,
        care_plan_id=medication.care_plan_id,
        patient_id=medication.patient_id,
        name=medication.name,
        dosage=medication.dosage,
        frequency=MedicationFrequency.model_validate(medication.frequency),
        start_at=medication.start_at,
        end_at=medication.end_at,
        instructions=medication.instructions,
        created_at=medication.created_at,
    )


def _event_row_to_read(row: EventRow) -> MedicationEventRead:
    event, name, dosage = row
    return MedicationEventRead(
        id=event.id,
        medication_id=event.medication_id,
        medication_name=name,
        medication_dosage=dosage,
        patient_id=event.patient_id,
        scheduled_at=event.scheduled_at,
        state=event.state,
        acted_at=event.acted_at,
    )


async def list_for_care_plan(session: AsyncSession, care_plan_id: UUID) -> list[MedicationRead]:
    stmt = (
        select(Medication)
        .where(Medication.care_plan_id == care_plan_id)
        .order_by(Medication.start_at.desc(), Medication.created_at.desc())
    )
    result = await session.execute(stmt)
    return [_medication_to_read(m) for m in result.scalars().all()]


async def create_medication(
    session: AsyncSession,
    *,
    care_plan_id: UUID,
    patient_id: UUID,
    patient_timezone: str,
    payload: CreateMedicationRequest,
) -> tuple[Medication, int]:
    medication = Medication(
        care_plan_id=care_plan_id,
        patient_id=patient_id,
        name=payload.name,
        dosage=payload.dosage,
        frequency=payload.frequency.model_dump(),
        start_at=payload.start_at,
        end_at=payload.end_at,
        instructions=payload.instructions,
    )
    session.add(medication)
    await session.flush()

    events = materialize_events(
        medication_id=medication.id,
        patient_id=patient_id,
        hours=payload.frequency.hours,
        start_at=payload.start_at,
        end_at=payload.end_at,
        patient_timezone=patient_timezone,
    )
    for event in events:
        session.add(event)
    await session.flush()
    return medication, len(events)


async def resolve_patient_timezone(session: AsyncSession, patient_id: UUID) -> str:
    patient = await session.get(Patient, patient_id)
    if patient is None:
        return "UTC"
    return patient.timezone or "UTC"


def _day_bounds_utc(day: date, tz_name: str) -> tuple[datetime, datetime]:
    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        tz = ZoneInfo("UTC")
    start_local = datetime.combine(day, time.min, tzinfo=tz)
    end_local = datetime.combine(day + timedelta(days=1), time.min, tzinfo=tz)
    return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)


def _events_select() -> Select[EventRow]:
    return select(MedicationEvent, Medication.name, Medication.dosage).join(
        Medication, Medication.id == MedicationEvent.medication_id
    )


async def list_events_for_patient_on_day(
    session: AsyncSession,
    *,
    patient_id: UUID,
    patient_timezone: str,
    day: date,
) -> list[MedicationEventRead]:
    start_utc, end_utc = _day_bounds_utc(day, patient_timezone)
    stmt = (
        _events_select()
        .where(
            MedicationEvent.patient_id == patient_id,
            MedicationEvent.scheduled_at >= start_utc,
            MedicationEvent.scheduled_at < end_utc,
        )
        .order_by(MedicationEvent.scheduled_at.asc())
    )
    result = await session.execute(stmt)
    return [_event_row_to_read(row) for row in result.tuples().all()]


async def get_event_entity(session: AsyncSession, event_id: UUID) -> MedicationEvent | None:
    return await session.get(MedicationEvent, event_id)


async def update_event_state(
    session: AsyncSession,
    event: MedicationEvent,
    new_state: MedicationEventState,
) -> MedicationEvent:
    event.state = new_state
    event.acted_at = datetime.now(tz=timezone.utc)
    await session.flush()
    return event


async def get_event_read(
    session: AsyncSession, event_id: UUID
) -> MedicationEventRead | None:
    stmt = _events_select().where(MedicationEvent.id == event_id)
    result = await session.execute(stmt)
    row = result.tuples().first()
    if row is None:
        return None
    return _event_row_to_read(row)
