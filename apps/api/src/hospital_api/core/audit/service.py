from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from hospital_api.core.audit.models import AuditLog


async def record_audit(
    session: AsyncSession,
    *,
    action: str,
    actor_user_id: UUID | None = None,
    resource_type: str | None = None,
    resource_id: UUID | None = None,
    ip: str | None = None,
    user_agent: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    entry = AuditLog(
        actor_user_id=actor_user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip=ip,
        user_agent=user_agent,
        metadata_=metadata or {},
    )
    session.add(entry)
    await session.flush()
