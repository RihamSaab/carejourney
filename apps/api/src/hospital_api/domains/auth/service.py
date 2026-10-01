from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from hospital_api.config import Settings
from hospital_api.core.audit import record_audit
from hospital_api.core.errors import ConflictError, UnauthorizedError
from hospital_api.core.security import (
    encode_access_token,
    generate_refresh_token,
    hash_refresh_token,
    verify_password,
)
from hospital_api.domains.auth.models import (
    OneTimeToken,
    OneTimeTokenPurpose,
    RefreshToken,
)
from hospital_api.domains.auth.schemas import TokenPair
from hospital_api.domains.patients import service as patients_service
from hospital_api.domains.users import service as users_service
from hospital_api.domains.users.models import User, UserRole, UserStatus
from hospital_api.integrations.email import (
    send_password_reset_email,
    send_verification_email,
)


async def _issue_tokens(
    session: AsyncSession,
    *,
    settings: Settings,
    user: User,
) -> TokenPair:
    access_token = encode_access_token(
        settings,
        user_id=user.id,
        role=user.role.value,
        email=user.email,
    )
    refresh_plain = generate_refresh_token()
    refresh_row = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(refresh_plain),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_ttl_days),
    )
    session.add(refresh_row)
    await session.flush()
    return TokenPair(access_token=access_token, refresh_token=refresh_plain)


async def _revoke_all_user_refresh_tokens(session: AsyncSession, user_id: UUID) -> None:
    await session.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.now(timezone.utc))
    )


async def _create_one_time_token(
    session: AsyncSession,
    *,
    user_id: UUID,
    purpose: OneTimeTokenPurpose,
    ttl_hours: int,
) -> str:
    plain = generate_refresh_token()
    row = OneTimeToken(
        user_id=user_id,
        token_hash=hash_refresh_token(plain),
        purpose=purpose,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=ttl_hours),
    )
    session.add(row)
    await session.flush()
    return plain


async def _consume_one_time_token(
    session: AsyncSession,
    *,
    token: str,
    purpose: OneTimeTokenPurpose,
) -> OneTimeToken | None:
    hashed = hash_refresh_token(token)
    result = await session.execute(select(OneTimeToken).where(OneTimeToken.token_hash == hashed))
    row = result.scalar_one_or_none()
    if row is None or row.purpose != purpose:
        return None
    if row.used_at is not None or row.expires_at < datetime.now(timezone.utc):
        return None
    row.used_at = datetime.now(timezone.utc)
    await session.flush()
    return row


async def register(
    session: AsyncSession,
    *,
    settings: Settings,
    email: str,
    password: str,
    full_name: str,
    role: UserRole,
    ip: str | None,
    user_agent: str | None,
) -> User:
    existing = await users_service.get_by_email(session, email)
    if existing is not None:
        raise ConflictError("An account with this email already exists.")

    user = await users_service.create_user(
        session,
        email=email,
        plain_password=password,
        full_name=full_name,
        role=role,
    )

    if role == UserRole.PATIENT:
        await patients_service.get_or_create_for_user(session, user)

    token = await _create_one_time_token(
        session,
        user_id=user.id,
        purpose=OneTimeTokenPurpose.EMAIL_VERIFICATION,
        ttl_hours=settings.verification_token_ttl_hours,
    )
    await send_verification_email(settings, to=user.email, full_name=user.full_name, token=token)

    await record_audit(
        session,
        action="user.registered",
        actor_user_id=user.id,
        resource_type="user",
        resource_id=user.id,
        ip=ip,
        user_agent=user_agent,
        metadata={"role": user.role.value},
    )

    return user


async def verify_email(
    session: AsyncSession,
    *,
    token: str,
    ip: str | None,
    user_agent: str | None,
) -> None:
    row = await _consume_one_time_token(
        session,
        token=token,
        purpose=OneTimeTokenPurpose.EMAIL_VERIFICATION,
    )
    if row is None:
        raise UnauthorizedError("This verification link is invalid or has expired.")

    user = await users_service.get_by_id(session, row.user_id)
    if user is None:
        raise UnauthorizedError("User no longer exists.")

    if user.status != UserStatus.ACTIVE:
        await users_service.activate_user(session, user)

    await record_audit(
        session,
        action="user.verified",
        actor_user_id=user.id,
        resource_type="user",
        resource_id=user.id,
        ip=ip,
        user_agent=user_agent,
    )


async def resend_verification(
    session: AsyncSession,
    *,
    settings: Settings,
    email: str,
) -> None:
    user = await users_service.get_by_email(session, email)
    if user is None or user.status != UserStatus.PENDING_VERIFICATION:
        return

    token = await _create_one_time_token(
        session,
        user_id=user.id,
        purpose=OneTimeTokenPurpose.EMAIL_VERIFICATION,
        ttl_hours=settings.verification_token_ttl_hours,
    )
    await send_verification_email(settings, to=user.email, full_name=user.full_name, token=token)


async def login(
    session: AsyncSession,
    *,
    settings: Settings,
    email: str,
    password: str,
    ip: str | None,
    user_agent: str | None,
) -> tuple[User, TokenPair]:
    user = await users_service.get_by_email(session, email)

    if (
        user is None
        or user.password_hash is None
        or not verify_password(password, user.password_hash)
    ):
        await record_audit(
            session,
            action="user.login.failed",
            actor_user_id=user.id if user else None,
            resource_type="user",
            resource_id=user.id if user else None,
            ip=ip,
            user_agent=user_agent,
            metadata={"reason": "invalid_credentials", "email": email.lower()},
        )
        raise UnauthorizedError("Invalid email or password.")

    if user.status != UserStatus.ACTIVE:
        await record_audit(
            session,
            action="user.login.failed",
            actor_user_id=user.id,
            resource_type="user",
            resource_id=user.id,
            ip=ip,
            user_agent=user_agent,
            metadata={"reason": "inactive", "status": user.status.value},
        )
        raise UnauthorizedError("Please verify your email before signing in.")

    tokens = await _issue_tokens(session, settings=settings, user=user)
    await record_audit(
        session,
        action="user.login.success",
        actor_user_id=user.id,
        resource_type="user",
        resource_id=user.id,
        ip=ip,
        user_agent=user_agent,
    )
    return user, tokens


async def refresh(
    session: AsyncSession,
    *,
    settings: Settings,
    refresh_token: str,
    ip: str | None,
    user_agent: str | None,
) -> tuple[User, TokenPair]:
    hashed = hash_refresh_token(refresh_token)
    result = await session.execute(select(RefreshToken).where(RefreshToken.token_hash == hashed))
    row = result.scalar_one_or_none()

    if row is None:
        raise UnauthorizedError("Refresh token invalid.")

    if row.revoked_at is not None:
        await _revoke_all_user_refresh_tokens(session, row.user_id)
        await record_audit(
            session,
            action="user.session.compromised",
            actor_user_id=row.user_id,
            resource_type="user",
            resource_id=row.user_id,
            ip=ip,
            user_agent=user_agent,
            metadata={"reason": "revoked_refresh_reuse"},
        )
        raise UnauthorizedError("Refresh token has been revoked.")

    if row.expires_at < datetime.now(timezone.utc):
        raise UnauthorizedError("Refresh token has expired.")

    user = await users_service.get_by_id(session, row.user_id)
    if user is None or user.status != UserStatus.ACTIVE:
        raise UnauthorizedError("User is not active.")

    row.revoked_at = datetime.now(timezone.utc)
    await session.flush()

    tokens = await _issue_tokens(session, settings=settings, user=user)
    await record_audit(
        session,
        action="user.session.refreshed",
        actor_user_id=user.id,
        resource_type="user",
        resource_id=user.id,
        ip=ip,
        user_agent=user_agent,
    )
    return user, tokens


async def logout(
    session: AsyncSession,
    *,
    refresh_token: str,
    ip: str | None,
    user_agent: str | None,
) -> None:
    hashed = hash_refresh_token(refresh_token)
    result = await session.execute(select(RefreshToken).where(RefreshToken.token_hash == hashed))
    row = result.scalar_one_or_none()
    if row is None or row.revoked_at is not None:
        return

    row.revoked_at = datetime.now(timezone.utc)
    await session.flush()

    await record_audit(
        session,
        action="user.logout",
        actor_user_id=row.user_id,
        resource_type="user",
        resource_id=row.user_id,
        ip=ip,
        user_agent=user_agent,
    )


async def forgot_password(
    session: AsyncSession,
    *,
    settings: Settings,
    email: str,
    ip: str | None,
    user_agent: str | None,
) -> None:
    user = await users_service.get_by_email(session, email)
    if user is None:
        return

    token = await _create_one_time_token(
        session,
        user_id=user.id,
        purpose=OneTimeTokenPurpose.PASSWORD_RESET,
        ttl_hours=settings.password_reset_token_ttl_hours,
    )
    await send_password_reset_email(
        settings, to=user.email, full_name=user.full_name, token=token
    )

    await record_audit(
        session,
        action="user.password_reset_requested",
        actor_user_id=user.id,
        resource_type="user",
        resource_id=user.id,
        ip=ip,
        user_agent=user_agent,
    )


async def reset_password(
    session: AsyncSession,
    *,
    token: str,
    new_password: str,
    ip: str | None,
    user_agent: str | None,
) -> None:
    row = await _consume_one_time_token(
        session,
        token=token,
        purpose=OneTimeTokenPurpose.PASSWORD_RESET,
    )
    if row is None:
        raise UnauthorizedError("This reset link is invalid or has expired.")

    user = await users_service.get_by_id(session, row.user_id)
    if user is None:
        raise UnauthorizedError("User no longer exists.")

    await users_service.update_password(session, user, new_password)
    await _revoke_all_user_refresh_tokens(session, user.id)

    await record_audit(
        session,
        action="user.password_reset",
        actor_user_id=user.id,
        resource_type="user",
        resource_id=user.id,
        ip=ip,
        user_agent=user_agent,
    )
