from datetime import date
from uuid import UUID

from sqlalchemy import Select, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from hospital_api.domains.care_plans.models import CarePlan, CarePlanStatus
from hospital_api.domains.care_plans.schemas import CarePlanRead
from hospital_api.domains.users.models import User

PatientAlias = aliased(User, name="patient_u")
ProfessionalAlias = aliased(User, name="professional_u")

CarePlanRow = tuple[CarePlan, str, str, str]


def _row_to_dto(row: CarePlanRow) -> CarePlanRead:
    plan, patient_full_name, patient_email, professional_full_name = row
    return CarePlanRead(
        id=plan.id,
        patient_id=plan.patient_id,
        patient_full_name=patient_full_name,
        patient_email=patient_email,
        professional_id=plan.professional_id,
        professional_full_name=professional_full_name,
        title=plan.title,
        description=plan.description,
        start_at=plan.start_at,
        end_at=plan.end_at,
        status=plan.status,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
    )


def _base_select() -> Select[CarePlanRow]:
    return (
        select(
            CarePlan,
            PatientAlias.full_name,
            PatientAlias.email,
            ProfessionalAlias.full_name,
        )
        .join(PatientAlias, PatientAlias.id == CarePlan.patient_id)
        .join(ProfessionalAlias, ProfessionalAlias.id == CarePlan.professional_id)
    )


async def list_for_user(session: AsyncSession, user_id: UUID) -> list[CarePlanRead]:
    stmt = (
        _base_select()
        .where(or_(CarePlan.patient_id == user_id, CarePlan.professional_id == user_id))
        .order_by(CarePlan.created_at.desc())
    )
    result = await session.execute(stmt)
    return [_row_to_dto(row) for row in result.tuples().all()]


async def get_by_id(session: AsyncSession, plan_id: UUID) -> CarePlanRead | None:
    stmt = _base_select().where(CarePlan.id == plan_id)
    result = await session.execute(stmt)
    row = result.tuples().first()
    if row is None:
        return None
    return _row_to_dto(row)


async def get_plan_entity(session: AsyncSession, plan_id: UUID) -> CarePlan | None:
    return await session.get(CarePlan, plan_id)


async def create_plan(
    session: AsyncSession,
    *,
    patient: User,
    professional: User,
    title: str,
    description: str | None,
    start_at: date | None,
    end_at: date | None,
    status: CarePlanStatus,
) -> CarePlan:
    plan = CarePlan(
        patient_id=patient.id,
        professional_id=professional.id,
        title=title,
        description=description,
        start_at=start_at,
        end_at=end_at,
        status=status,
    )
    session.add(plan)
    await session.flush()
    return plan


async def update_plan(
    session: AsyncSession,
    plan: CarePlan,
    updates: dict[str, object],
) -> CarePlan:
    for field, value in updates.items():
        setattr(plan, field, value)
    await session.flush()
    return plan
