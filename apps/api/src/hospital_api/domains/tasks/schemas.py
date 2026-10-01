from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from hospital_api.domains.tasks.models import TaskPriority, TaskStatus


class TaskRead(BaseModel):
    id: UUID
    care_plan_id: UUID
    care_plan_title: str
    patient_id: UUID
    professional_id: UUID
    title: str
    description: str | None
    due_at: date | None
    priority: TaskPriority
    status: TaskStatus
    is_overdue: bool
    created_at: datetime
    updated_at: datetime


class CreateTaskRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    due_at: date | None = None
    priority: TaskPriority = TaskPriority.NORMAL


class UpdateTaskRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    due_at: date | None = None
    priority: TaskPriority | None = None
    status: TaskStatus | None = None
