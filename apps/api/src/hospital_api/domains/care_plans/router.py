from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from hospital_api.core.audit import record_audit
from hospital_api.core.errors import ForbiddenError, NotFoundError
from hospital_api.db import get_session
from hospital_api.domains.auth.dependencies import get_current_user
from hospital_api.domains.care_plans import service as care_plans_service
from hospital_api.domains.care_plans.dependencies import get_care_plan_for_user
from hospital_api.domains.care_plans.models import CarePlan
from hospital_api.domains.care_plans.schemas import (
    CarePlanRead,
    CreateCarePlanRequest,
    UpdateCarePlanRequest,
)
from hospital_api.domains.users import service as users_service
from hospital_api.domains.users.models import User, UserRole

router = APIRouter(prefix="/care-plans", tags=["care-plans"])


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def _user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


@router.get("", response_model=list[CarePlanRead])
async def list_my_care_plans(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[CarePlanRead]:
    return await care_plans_service.list_for_user(session, current_user.id)


@router.post("", response_model=CarePlanRead, status_code=status.HTTP_201_CREATED)
async def create_care_plan(
    request: Request,
    body: CreateCarePlanRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CarePlanRead:
    if current_user.role != UserRole.PROFESSIONAL:
        raise ForbiddenError("Only healthcare professionals can create care plans.")

    patient = await users_service.get_by_email(session, body.patient_email)
    if patient is None or patient.role != UserRole.PATIENT:
        raise NotFoundError("No patient account found for that email.")

    plan = await care_plans_service.create_plan(
        session,
        patient=patient,
        professional=current_user,
        title=body.title,
        description=body.description,
        start_at=body.start_at,
        end_at=body.end_at,
        status=body.status,
    )

    await record_audit(
        session,
        action="care_plan.created",
        actor_user_id=current_user.id,
        resource_type="care_plan",
        resource_id=plan.id,
        ip=_client_ip(request),
        user_agent=_user_agent(request),
        metadata={"patient_id": str(patient.id)},
    )

    await session.commit()

    dto = await care_plans_service.get_by_id(session, plan.id)
    assert dto is not None
    return dto


@router.get("/{plan_id}", response_model=CarePlanRead)
async def read_care_plan(
    current: Annotated[tuple[User, CarePlan], Depends(get_care_plan_for_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CarePlanRead:
    _, plan = current
    dto = await care_plans_service.get_by_id(session, plan.id)
    assert dto is not None
    return dto


@router.patch("/{plan_id}", response_model=CarePlanRead)
async def update_care_plan(
    request: Request,
    body: UpdateCarePlanRequest,
    current: Annotated[tuple[User, CarePlan], Depends(get_care_plan_for_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CarePlanRead:
    user, plan = current
    if plan.professional_id != user.id:
        raise ForbiddenError("Only the creating professional can update this plan.")

    changes = body.model_dump(exclude_unset=True)
    if changes:
        await care_plans_service.update_plan(session, plan, changes)
        await record_audit(
            session,
            action="care_plan.updated",
            actor_user_id=user.id,
            resource_type="care_plan",
            resource_id=plan.id,
            ip=_client_ip(request),
            user_agent=_user_agent(request),
            metadata={"fields": sorted(changes.keys())},
        )

    await session.commit()
    dto = await care_plans_service.get_by_id(session, plan.id)
    assert dto is not None
    return dto
