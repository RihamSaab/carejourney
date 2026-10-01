from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from hospital_api.db.session import Database


class _DatabaseHolder:
    instance: Database | None = None


def set_database(database: Database | None) -> None:
    _DatabaseHolder.instance = database


def get_database() -> Database:
    if _DatabaseHolder.instance is None:
        raise RuntimeError("Database not initialized. Ensure app lifespan has started.")
    return _DatabaseHolder.instance


async def get_session(
    database: Annotated[Database, Depends(get_database)],
) -> AsyncIterator[AsyncSession]:
    async with database.sessionmaker() as session:
        yield session
