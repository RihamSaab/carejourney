from datetime import date, datetime
from typing import Annotated, Literal
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from hospital_api.core.audit import record_audit
from hospital_api.core.errors import AppError, ForbiddenError
from hospital_api.db import get_session
from hospital_api.domains.auth.dependencies import get_current_user
from hospital_api.domains.care_plans.models import CarePlan
from hospital_api.domains.tasks import service as tasks_service
from hospital_api.domains.tasks.dependencies import (
    get_care_plan_for_user,
    get_task_for_user,
)
from hospital_api.domains.tasks.models import Task, TaskStatus
from hospital_api.domains.tasks.schemas import (
    CreateTaskRequest,
    TaskRead,
    UpdateTaskRequest,
)
from hospital_api.domains.users.models import User, UserRole

care_plan_tasks_router = APIRouter(prefix="/care-plans", tags=["tasks"])
tasks_router = APIRouter(prefix="/tasks", tags=["tasks"])


class _InvalidTransitionError(AppError):
    status_code = 422
    error_code = "invalid_transition"
    message = "Invalid status transition for this task."


class _PatientFieldForbiddenError(AppError):
    status_code = 422
    error_code = "patient_cannot_edit_fields"
    message = "Patients may only change task status."


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def _user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


async def _patient_today(session: AsyncSession, patient_id: UUID) -> date:
    tz_name = await tasks_service.resolve_patient_timezone(session, patient_id)
    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        tz = ZoneInfo("UTC")
    return datetime.now(tz=tz).date()


@care_plan_tasks_router.get("/{plan_id}/tasks", response_model=list[TaskRead])
async def list_tasks(
    current: Annotated[tuple[User, CarePlan], Depends(get_care_plan_for_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[TaskRead]:
    _, plan = current
    today = await _patient_today(session, plan.patient_id)
    return await tasks_service.list_for_care_plan(session, care_plan_id=plan.id, today=today)


@care_plan_tasks_router.post(
    "/{plan_id}/tasks",
    response_model=TaskRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    request: Request,
    body: CreateTaskRequest,
    current: Annotated[tuple[User, CarePlan], Depends(get_care_plan_for_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TaskRead:
    user, plan = current
    if user.role != UserRole.PROFESSIONAL or plan.professional_id != user.id:
        raise ForbiddenError("Only the creating professional can add tasks.")

    task = await tasks_service.create_task(
        session,
        care_plan=plan,
        professional_id=user.id,
        title=body.title,
        description=body.description,
        due_at=body.due_at,
        priority=body.priority,
    )

    await record_audit(
        session,
        action="task.created",
        actor_user_id=user.id,
        resource_type="task",
        resource_id=task.id,
        ip=_client_ip(request),
        user_agent=_user_agent(request),
        metadata={
            "care_plan_id": str(plan.id),
            "patient_id": str(plan.patient_id),
            "due_at": body.due_at.isoformat() if body.due_at else None,
            "priority": body.priority.value,
        },
    )

    await session.commit()
    today = await _patient_today(session, plan.patient_id)
    dto = await tasks_service.get_task_read(session, task.id, today)
    assert dto is not None
    return dto


@tasks_router.get("", response_model=list[TaskRead])
async def list_upcoming_tasks(
    _scope: Annotated[Literal["upcoming"], Query(alias="scope")],
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[TaskRead]:
    if current_user.role != UserRole.PATIENT:
        raise ForbiddenError("Only patients can view their upcoming tasks.")
    today = await _patient_today(session, current_user.id)
    return await tasks_service.list_upcoming_for_patient(
        session,
        patient_id=current_user.id,
        today=today,
    )


@tasks_router.patch("/{task_id}", response_model=TaskRead)
async def update_task(
    request: Request,
    body: UpdateTaskRequest,
    current: Annotated[tuple[User, Task], Depends(get_task_for_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TaskRead:
    user, task = current
    is_professional = user.role == UserRole.PROFESSIONAL and user.id == task.professional_id
    is_patient = user.role == UserRole.PATIENT and user.id == task.patient_id

    if not is_professional and not is_patient:
        raise ForbiddenError("You cannot update this task.")

    updates = body.model_dump(exclude_unset=True)

    non_status_fields = {"title", "description", "due_at", "priority"}
    touching_non_status = any(field in updates for field in non_status_fields)

    if is_patient and not is_professional and touching_non_status:
        raise _PatientFieldForbiddenError()

    if "status" in updates:
        requested_status = updates["status"]
        if requested_status != task.status:
            allowed = (
                tasks_service.PROFESSIONAL_TRANSITIONS[task.status]
                if is_professional
                else tasks_service.PATIENT_TRANSITIONS[task.status]
            )
            if requested_status not in allowed:
                raise _InvalidTransitionError(
                    f"Cannot move task from {task.status.value} to {requested_status.value}."
                )

    previous_status = task.status
    await tasks_service.apply_updates(session, task, updates)

    audit_metadata: dict[str, object] = {"fields": sorted(updates.keys())}
    if "status" in updates and updates["status"] != previous_status:
        new_status = updates["status"]
        audit_metadata["from"] = previous_status.value
        audit_metadata["to"] = (
            new_status.value if isinstance(new_status, TaskStatus) else str(new_status)
        )

    await record_audit(
        session,
        action="task.updated",
        actor_user_id=user.id,
        resource_type="task",
        resource_id=task.id,
        ip=_client_ip(request),
        user_agent=_user_agent(request),
        metadata=audit_metadata,
    )

    await session.commit()
    today = await _patient_today(session, task.patient_id)
    dto = await tasks_service.get_task_read(session, task.id, today)
    assert dto is not None
    return dto
