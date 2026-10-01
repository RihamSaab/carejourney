from typing import Annotated

import jwt
import structlog
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from hospital_api.config import Settings, get_settings
from hospital_api.core.errors import UnauthorizedError
from hospital_api.core.security import decode_access_token
from hospital_api.db import get_session
from hospital_api.domains.users import service as users_service
from hospital_api.domains.users.models import User, UserStatus

_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
    settings: Annotated[Settings, Depends(get_settings)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise UnauthorizedError("Missing bearer token.")

    try:
        payload = decode_access_token(settings, credentials.credentials)
    except jwt.ExpiredSignatureError as exc:
        raise UnauthorizedError("Access token expired.") from exc
    except jwt.InvalidTokenError as exc:
        raise UnauthorizedError("Access token invalid.") from exc

    user = await users_service.get_by_id(session, payload.user_id)
    if user is None or user.status != UserStatus.ACTIVE:
        raise UnauthorizedError("Account is not active.")

    structlog.contextvars.bind_contextvars(user_id=str(user.id), role=user.role.value)
    return user
