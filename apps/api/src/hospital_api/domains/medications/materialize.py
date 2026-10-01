from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from uuid import UUID
from zoneinfo import ZoneInfo

from hospital_api.domains.medications.models import MedicationEvent, MedicationEventState

DEFAULT_HORIZON_DAYS = 30


@dataclass(frozen=True)
class ScheduledEvent:
    medication_id: UUID
    patient_id: UUID
    scheduled_at: datetime


def materialize_events(
    *,
    medication_id: UUID,
    patient_id: UUID,
    hours: list[str],
    start_at: date,
    end_at: date | None,
    patient_timezone: str = "UTC",
    horizon_days: int = DEFAULT_HORIZON_DAYS,
) -> list[MedicationEvent]:
    try:
        tz = ZoneInfo(patient_timezone)
    except Exception:
        tz = ZoneInfo("UTC")

    horizon_end = start_at + timedelta(days=horizon_days)
    window_end = end_at if (end_at and end_at < horizon_end) else horizon_end

    sorted_hours = sorted(hours)
    rows: list[MedicationEvent] = []
    day = start_at
    while day <= window_end:
        for hhmm in sorted_hours:
            hour_str, minute_str = hhmm.split(":")
            local_dt = datetime(
                day.year,
                day.month,
                day.day,
                int(hour_str),
                int(minute_str),
                tzinfo=tz,
            )
            rows.append(
                MedicationEvent(
                    medication_id=medication_id,
                    patient_id=patient_id,
                    scheduled_at=local_dt.astimezone(timezone.utc),
                    state=MedicationEventState.SCHEDULED,
                )
            )
        day = day + timedelta(days=1)
    return rows
