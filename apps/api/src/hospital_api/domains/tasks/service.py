from datetime import date, datetime, timezone
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import Select, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from hospital_api.domains.care_plans.models import CarePlan
from hospital_api.domains.patients.models import Patient
from hospital_api.domains.tasks.models import Task, TaskPriority, TaskStatus
from hospital_api.domains.tasks.schemas import TaskRead

TaskRow = tuple[Task, str]

PATIENT_TRANSITIONS: dict[TaskStatus, set[TaskStatus]] = {
    TaskStatus.PENDING: {TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED},
    TaskStatus.IN_PROGRESS: {TaskStatus.PENDING, TaskStatus.COMPLETED},
    TaskStatus.COMPLETED: set(),
    TaskStatus.CANCELLED: set(),
}

PROFESSIONAL_TRANSITIONS: dict[TaskStatus, set[TaskStatus]] = {
    TaskStatus.PENDING: {TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.CANCELLED},
    TaskStatus.IN_PROGRESS: {TaskStatus.PENDING, TaskStatus.COMPLETED, TaskStatus.CANCELLED},
    TaskStatus.COMPLETED: {TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED},
    TaskStatus.CANCELLED: {TaskStatus.PENDING},
}


def _today(tz_name: str) -> date:
    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        tz = ZoneInfo("UTC")
    return datetime.now(tz=tz).date()


def _row_to_dto(row: TaskRow, today: date) -> TaskRead:
    task, care_plan_title = row
    is_overdue = (
        task.status == TaskStatus.PENDING
        and task.due_at is not None
        and task.due_at < today
    )
    return TaskRead(
        id=task.id,
        care_plan_id=task.care_plan_id,
        care_plan_title=care_plan_title,
        patient_id=task.patient_id,
        professional_id=task.professional_id,
        title=task.title,
        description=task.description,
        due_at=task.due_at,
        priority=task.priority,
        status=task.status,
        is_overdue=is_overdue,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


def _base_select() -> Select[TaskRow]:
    return select(Task, CarePlan.title).join(CarePlan, CarePlan.id == Task.care_plan_id)


async def resolve_patient_timezone(session: AsyncSession, patient_id: UUID) -> str:
    patient = await session.get(Patient, patient_id)
    if patient is None:
        return "UTC"
    return patient.timezone or "UTC"


async def list_for_care_plan(
    session: AsyncSession,
    *,
    care_plan_id: UUID,
    today: date,
) -> list[TaskRead]:
    stmt = (
        _base_select()
        .where(Task.care_plan_id == care_plan_id)
        .order_by(Task.status.asc(), Task.due_at.asc().nulls_last(), Task.created_at.desc())
    )
    result = await session.execute(stmt)
    return [_row_to_dto(row, today) for row in result.tuples().all()]


async def list_upcoming_for_patient(
    session: AsyncSession,
    *,
    patient_id: UUID,
    today: date,
) -> list[TaskRead]:
    stmt = (
        _base_select()
        .where(
            Task.patient_id == patient_id,
            or_(Task.status == TaskStatus.PENDING, Task.status == TaskStatus.IN_PROGRESS),
        )
        .order_by(Task.due_at.asc().nulls_last(), Task.created_at.desc())
    )
    result = await session.execute(stmt)
    return [_row_to_dto(row, today) for row in result.tuples().all()]


async def get_task_entity(session: AsyncSession, task_id: UUID) -> Task | None:
    return await session.get(Task, task_id)


async def get_task_read(
    session: AsyncSession, task_id: UUID, today: date
) -> TaskRead | None:
    stmt = _base_select().where(Task.id == task_id)
    result = await session.execute(stmt)
    row = result.tuples().first()
    if row is None:
        return None
    return _row_to_dto(row, today)


async def create_task(
    session: AsyncSession,
    *,
    care_plan: CarePlan,
    professional_id: UUID,
    title: str,
    description: str | None,
    due_at: date | None,
    priority: TaskPriority,
) -> Task:
    task = Task(
        care_plan_id=care_plan.id,
        patient_id=care_plan.patient_id,
        professional_id=professional_id,
        title=title,
        description=description,
        due_at=due_at,
        priority=priority,
        status=TaskStatus.PENDING,
    )
    session.add(task)
    await session.flush()
    return task


async def apply_updates(
    session: AsyncSession,
    task: Task,
    updates: dict[str, object],
) -> Task:
    for field, value in updates.items():
        setattr(task, field, value)
    await session.flush()
    return task


def _ensure_timezone_aware_now() -> datetime:
    return datetime.now(tz=timezone.utc)
