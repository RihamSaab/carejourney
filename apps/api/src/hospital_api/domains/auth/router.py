from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from hospital_api.config import Settings, get_settings
from hospital_api.core.rate_limit import limiter
from hospital_api.db import get_session
from hospital_api.domains.auth import service as auth_service
from hospital_api.domains.auth.schemas import (
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationRequest,
    ResetPasswordRequest,
    VerifyRequest,
)
from hospital_api.domains.users.models import UserRole
from hospital_api.domains.users.schemas import UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def _user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def register(
    request: Request,
    body: RegisterRequest,
    settings: Annotated[Settings, Depends(get_settings)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> RegisterResponse:
    user = await auth_service.register(
        session,
        settings=settings,
        email=body.email,
        password=body.password,
        full_name=body.full_name,
        role=UserRole(body.role),
        ip=_client_ip(request),
        user_agent=_user_agent(request),
    )
    await session.commit()
    return RegisterResponse(user_id=user.id)


@router.post("/verify", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def verify(
    request: Request,
    body: VerifyRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> None:
    await auth_service.verify_email(
        session,
        token=body.token,
        ip=_client_ip(request),
        user_agent=_user_agent(request),
    )
    await session.commit()


@router.post("/resend-verification", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("1/minute")
async def resend_verification(
    request: Request,
    body: ResendVerificationRequest,
    settings: Annotated[Settings, Depends(get_settings)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> None:
    await auth_service.resend_verification(session, settings=settings, email=body.email)
    await session.commit()


@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    body: LoginRequest,
    settings: Annotated[Settings, Depends(get_settings)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> LoginResponse:
    user, tokens = await auth_service.login(
        session,
        settings=settings,
        email=body.email,
        password=body.password,
        ip=_client_ip(request),
        user_agent=_user_agent(request),
    )
    await session.commit()
    return LoginResponse(user=UserRead.model_validate(user), tokens=tokens)


@router.post("/refresh", response_model=LoginResponse)
@limiter.limit("30/minute")
async def refresh(
    request: Request,
    body: RefreshRequest,
    settings: Annotated[Settings, Depends(get_settings)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> LoginResponse:
    user, tokens = await auth_service.refresh(
        session,
        settings=settings,
        refresh_token=body.refresh_token,
        ip=_client_ip(request),
        user_agent=_user_agent(request),
    )
    await session.commit()
    return LoginResponse(user=UserRead.model_validate(user), tokens=tokens)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/minute")
async def logout(
    request: Request,
    body: LogoutRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> None:
    await auth_service.logout(
        session,
        refresh_token=body.refresh_token,
        ip=_client_ip(request),
        user_agent=_user_agent(request),
    )
    await session.commit()


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("3/hour")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    settings: Annotated[Settings, Depends(get_settings)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> None:
    await auth_service.forgot_password(
        session,
        settings=settings,
        email=body.email,
        ip=_client_ip(request),
        user_agent=_user_agent(request),
    )
    await session.commit()


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/hour")
async def reset_password(
    request: Request,
    body: ResetPasswordRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> None:
    await auth_service.reset_password(
        session,
        token=body.token,
        new_password=body.new_password,
        ip=_client_ip(request),
        user_agent=_user_agent(request),
    )
    await session.commit()
