from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    environment: Literal["local", "preview", "staging", "production"] = "local"
    api_prefix: str = "/api/v1"

    cors_allow_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://localhost:5175",
            "http://localhost:5179",
        ]
    )

    database_url: str = "postgresql+asyncpg://dev:dev@localhost:5432/hospital"

    log_level: LogLevel = "INFO"
    log_json: bool = True

    sentry_dsn: str | None = None
    sentry_traces_sample_rate: float = 0.0

    jwt_secret: str = "change-me-in-prod-this-is-only-safe-for-local"  # noqa: S105
    jwt_algorithm: Literal["HS256"] = "HS256"
    jwt_access_ttl_minutes: int = 15
    jwt_refresh_ttl_days: int = 30

    verification_token_ttl_hours: int = 24
    password_reset_token_ttl_hours: int = 1

    resend_api_key: str | None = None
    email_from: str = "Hospital <no-reply@localhost>"

    frontend_base_url: str = "http://localhost:5173"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
