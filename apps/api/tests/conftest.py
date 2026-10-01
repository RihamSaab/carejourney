import os

os.environ.setdefault("TESTCONTAINERS_RYUK_DISABLED", "true")

from collections.abc import AsyncIterator, Iterator

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine
from testcontainers.community.postgres import PostgresContainer

from hospital_api.app import create_app
from hospital_api.config import Settings
from hospital_api.core.audit import models as _audit_models  # noqa: F401
from hospital_api.core.rate_limit import limiter
from hospital_api.db import Base, Database, get_database
from hospital_api.domains.appointments import models as _appointment_models  # noqa: F401
from hospital_api.domains.auth import models as _auth_models  # noqa: F401
from hospital_api.domains.care_plans import models as _care_plan_models  # noqa: F401
from hospital_api.domains.medications import models as _medication_models  # noqa: F401
from hospital_api.domains.patients import models as _patient_models  # noqa: F401
from hospital_api.domains.tasks import models as _task_models  # noqa: F401
from hospital_api.domains.users import models as _user_models  # noqa: F401


@pytest.fixture(scope="session")
def postgres_url() -> Iterator[str]:
    with PostgresContainer("postgres:16-alpine", driver="asyncpg") as pg:
        yield pg.get_connection_url()


@pytest_asyncio.fixture(scope="session")
async def _schema_ready(postgres_url: str) -> AsyncIterator[None]:
    engine = create_async_engine(postgres_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    yield


@pytest_asyncio.fixture(autouse=True)
async def _reset_tables(postgres_url: str, _schema_ready: None) -> AsyncIterator[None]:
    engine = create_async_engine(postgres_url)
    yield
    async with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())
    await engine.dispose()


@pytest.fixture(autouse=True)
def _reset_rate_limiter() -> None:
    limiter.reset()


@pytest.fixture
def settings(postgres_url: str) -> Settings:
    return Settings(
        environment="local",
        database_url=postgres_url,
        log_json=False,
    )


@pytest_asyncio.fixture
async def database(settings: Settings) -> AsyncIterator[Database]:
    db = Database(settings.database_url)
    try:
        yield db
    finally:
        await db.dispose()


@pytest.fixture
def app(settings: Settings, database: Database) -> FastAPI:
    fastapi_app = create_app(settings=settings)
    fastapi_app.dependency_overrides[get_database] = lambda: database
    return fastapi_app


@pytest_asyncio.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
