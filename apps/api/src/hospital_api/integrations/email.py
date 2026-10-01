import resend
from resend import Emails

from hospital_api.config import Settings
from hospital_api.core.logging import get_logger

logger = get_logger(__name__)


def _build_verify_body(full_name: str, link: str) -> str:
    return (
        f"Hi {full_name},\n\n"
        "Welcome to Hospital. Confirm your email address to activate your account:\n\n"
        f"{link}\n\n"
        "This link expires in 24 hours. If you didn't create an account, ignore this message.\n"
    )


def _build_reset_body(full_name: str, link: str) -> str:
    return (
        f"Hi {full_name},\n\n"
        "We received a request to reset your password. Follow this link to set a new one:\n\n"
        f"{link}\n\n"
        "This link expires in 1 hour. If you didn't request a reset, ignore this message.\n"
    )


async def _send(settings: Settings, *, to: str, subject: str, body: str) -> None:
    if not settings.resend_api_key:
        logger.info("email.send.dev", to=to, subject=subject, body=body)
        return

    payload: Emails.SendParams = {
        "from": settings.email_from,
        "to": [to],
        "subject": subject,
        "text": body,
    }
    resend.api_key = settings.resend_api_key
    try:
        Emails.send(payload)
        logger.info("email.send.ok", to=to, subject=subject)
    except Exception as exc:
        logger.exception("email.send.failed", to=to, subject=subject, error=str(exc))


async def send_verification_email(
    settings: Settings, *, to: str, full_name: str, token: str
) -> None:
    link = f"{settings.frontend_base_url.rstrip('/')}/verify?token={token}"
    await _send(
        settings,
        to=to,
        subject="Verify your account",
        body=_build_verify_body(full_name, link),
    )


async def send_password_reset_email(
    settings: Settings, *, to: str, full_name: str, token: str
) -> None:
    link = f"{settings.frontend_base_url.rstrip('/')}/reset?token={token}"
    await _send(
        settings,
        to=to,
        subject="Reset your password",
        body=_build_reset_body(full_name, link),
    )
