from typing import Literal

from pydantic import BaseModel


class HealthStatus(BaseModel):
    status: Literal["ok"] = "ok"
    environment: str


class LivenessStatus(BaseModel):
    status: Literal["alive"] = "alive"


class ReadinessStatus(BaseModel):
    status: Literal["ready", "not_ready"]
    checks: dict[str, bool]


class DbHealthStatus(BaseModel):
    db: Literal["ok"] = "ok"
    latency_ms: float
