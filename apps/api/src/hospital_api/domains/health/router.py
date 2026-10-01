import time
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from hospital_api.config import Settings, get_settings
from hospital_api.db import get_session
from hospital_api.domains.health.schemas import (
    DbHealthStatus,
    HealthStatus,
    LivenessStatus,
    ReadinessStatus,
)

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthStatus)
def get_health(settings: Annotated[Settings, Depends(get_settings)]) -> HealthStatus:
    return HealthStatus(environment=settings.environment)


@router.get("/live", response_model=LivenessStatus)
def get_health_live() -> LivenessStatus:
    return LivenessStatus()


@router.get("/ready", response_model=ReadinessStatus)
async def get_health_ready(
    session: Annotated[AsyncSession, Depends(get_session)],
    response: Response,
) -> ReadinessStatus:
    checks: dict[str, bool] = {}
    try:
        await session.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception:
        checks["database"] = False

    all_ready = all(checks.values())
    if not all_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return ReadinessStatus(status="ready" if all_ready else "not_ready", checks=checks)


@router.get("/db", response_model=DbHealthStatus)
async def get_health_db(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> DbHealthStatus:
    started = time.perf_counter()
    await session.execute(text("SELECT 1"))
    elapsed_ms = (time.perf_counter() - started) * 1000
    return DbHealthStatus(latency_ms=round(elapsed_ms, 2))
