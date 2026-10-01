from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from hospital_api.core.security import hash_password
from hospital_api.domains.users.models import User, UserRole, UserStatus


async def get_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


async def get_by_id(session: AsyncSession, user_id: UUID) -> User | None:
    return await session.get(User, user_id)


async def create_user(
    session: AsyncSession,
    *,
    email: str,
    plain_password: str,
    full_name: str,
    role: UserRole,
) -> User:
    user = User(
        email=email.lower(),
        password_hash=hash_password(plain_password),
        full_name=full_name,
        role=role,
        status=UserStatus.PENDING_VERIFICATION,
    )
    session.add(user)
    await session.flush()
    return user


async def activate_user(session: AsyncSession, user: User) -> None:
    user.status = UserStatus.ACTIVE
    await session.flush()


async def update_password(session: AsyncSession, user: User, plain_password: str) -> None:
    user.password_hash = hash_password(plain_password)
    await session.flush()
