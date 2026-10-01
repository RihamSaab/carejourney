import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from hospital_api.config import get_settings
from hospital_api.core.audit import models as _audit_models  # noqa: F401
from hospital_api.db import Base
from hospital_api.domains.appointments import models as _appointment_models  # noqa: F401
from hospital_api.domains.auth import models as _auth_models  # noqa: F401
from hospital_api.domains.care_plans import models as _care_plan_models  # noqa: F401
from hospital_api.domains.medications import models as _medication_models  # noqa: F401
from hospital_api.domains.patients import models as _patient_models  # noqa: F401
from hospital_api.domains.tasks import models as _task_models  # noqa: F401
from hospital_api.domains.users import models as _user_models  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

config.set_main_option("sqlalchemy.url", get_settings().database_url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
