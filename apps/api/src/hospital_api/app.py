from collections.abc import AsyncIterator, Callable
from contextlib import AbstractAsyncContextManager, asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from hospital_api.api import api_router
from hospital_api.config import Settings, get_settings
from hospital_api.core.errors import register_exception_handlers
from hospital_api.core.logging import configure_logging
from hospital_api.core.rate_limit import register_rate_limit
from hospital_api.core.request_id import RequestIdMiddleware
from hospital_api.core.request_logging import RequestLoggingMiddleware
from hospital_api.core.sentry import init_sentry
from hospital_api.db import Database, set_database

LifespanFactory = Callable[[FastAPI], AbstractAsyncContextManager[None]]


def _build_lifespan(settings: Settings) -> LifespanFactory:
    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
        init_sentry(settings)
        database = Database(settings.database_url)
        set_database(database)
        try:
            yield
        finally:
            await database.dispose()
            set_database(None)

    return lifespan


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    configure_logging(settings)

    app = FastAPI(
        title="Hospital API",
        version="0.0.0",
        openapi_url=f"{settings.api_prefix}/openapi.json",
        docs_url=f"{settings.api_prefix}/docs",
        redoc_url=f"{settings.api_prefix}/redoc",
        lifespan=_build_lifespan(settings),
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(RequestIdMiddleware)

    register_rate_limit(app)
    register_exception_handlers(app)
    app.include_router(api_router, prefix=settings.api_prefix)

    return app


app = create_app()
