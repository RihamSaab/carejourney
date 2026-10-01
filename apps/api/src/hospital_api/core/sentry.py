import sentry_sdk

from hospital_api.config import Settings
from hospital_api.core.logging import get_logger

logger = get_logger(__name__)


def init_sentry(settings: Settings) -> None:
    if not settings.sentry_dsn:
        logger.info("sentry.disabled", reason="no_dsn")
        return

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        send_default_pii=False,
    )
    logger.info("sentry.enabled", environment=settings.environment)
