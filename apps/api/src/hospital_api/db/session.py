from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)


class Database:
    engine: AsyncEngine
    sessionmaker: async_sessionmaker[AsyncSession]

    def __init__(self, url: str) -> None:
        self.engine = create_async_engine(url, pool_pre_ping=True, future=True)
        self.sessionmaker = async_sessionmaker(
            self.engine,
            expire_on_commit=False,
            class_=AsyncSession,
        )

    async def dispose(self) -> None:
        await self.engine.dispose()
