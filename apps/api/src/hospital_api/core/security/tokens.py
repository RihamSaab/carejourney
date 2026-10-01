import hashlib
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID, uuid4

import jwt

from hospital_api.config import Settings


@dataclass(frozen=True)
class AccessTokenPayload:
    user_id: UUID
    role: str
    email: str
    jti: str
    expires_at: datetime


def encode_access_token(settings: Settings, *, user_id: UUID, role: str, email: str) -> str:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.jwt_access_ttl_minutes)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "role": role,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
        "jti": uuid4().hex,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(settings: Settings, token: str) -> AccessTokenPayload:
    decoded: dict[str, Any] = jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
    )
    return AccessTokenPayload(
        user_id=UUID(str(decoded["sub"])),
        role=str(decoded["role"]),
        email=str(decoded["email"]),
        jti=str(decoded["jti"]),
        expires_at=datetime.fromtimestamp(int(decoded["exp"]), tz=timezone.utc),
    )


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(32)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
