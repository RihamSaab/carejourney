from httpx import AsyncClient
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from hospital_api.domains.users.models import User, UserStatus

EMAIL = "p1@test.com"
PASSWORD = "long-enough-pw-123"


async def _register(client: AsyncClient, email: str = EMAIL) -> str:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": PASSWORD,
            "full_name": "P One",
            "role": "patient",
        },
    )
    assert response.status_code == 201, response.text
    return str(response.json()["user_id"])


async def _activate(postgres_url: str, email: str = EMAIL) -> None:
    engine = create_async_engine(postgres_url)
    sm = async_sessionmaker(engine, expire_on_commit=False)
    async with sm() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one()
        await session.execute(
            update(User).where(User.id == user.id).values(status=UserStatus.ACTIVE)
        )
        await session.commit()
    await engine.dispose()


async def test_register_then_login_flow(client: AsyncClient, postgres_url: str) -> None:
    user_id = await _register(client)
    assert user_id

    bad_login = await client.post(
        "/api/v1/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
    )
    assert bad_login.status_code == 401

    await _activate(postgres_url)

    ok_login = await client.post(
        "/api/v1/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
    )
    assert ok_login.status_code == 200
    body = ok_login.json()
    assert body["user"]["email"] == EMAIL
    assert body["user"]["role"] == "patient"
    assert body["tokens"]["access_token"]
    assert body["tokens"]["refresh_token"]


async def test_register_duplicate_email_conflict(client: AsyncClient) -> None:
    await _register(client)
    second = await client.post(
        "/api/v1/auth/register",
        json={
            "email": EMAIL,
            "password": PASSWORD,
            "full_name": "Duplicate",
            "role": "patient",
        },
    )
    assert second.status_code == 409


async def test_login_wrong_password(client: AsyncClient, postgres_url: str) -> None:
    await _register(client)
    await _activate(postgres_url)

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": EMAIL, "password": "wrong-password-123"},
    )
    assert response.status_code == 401


async def test_users_me_requires_token(client: AsyncClient) -> None:
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401


async def test_users_me_returns_user(client: AsyncClient, postgres_url: str) -> None:
    await _register(client)
    await _activate(postgres_url)

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
    )
    access = login.json()["tokens"]["access_token"]

    me = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {access}"},
    )
    assert me.status_code == 200
    assert me.json()["email"] == EMAIL


async def test_refresh_rotates_tokens(client: AsyncClient, postgres_url: str) -> None:
    await _register(client)
    await _activate(postgres_url)
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
    )
    tokens = login.json()["tokens"]

    refreshed = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert refreshed.status_code == 200
    new_tokens = refreshed.json()["tokens"]
    assert new_tokens["refresh_token"] != tokens["refresh_token"]


async def test_refresh_reuse_marks_compromised(client: AsyncClient, postgres_url: str) -> None:
    await _register(client)
    await _activate(postgres_url)
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
    )
    first_refresh = login.json()["tokens"]["refresh_token"]

    await client.post("/api/v1/auth/refresh", json={"refresh_token": first_refresh})

    reused = await client.post("/api/v1/auth/refresh", json={"refresh_token": first_refresh})
    assert reused.status_code == 401


async def test_logout_revokes_refresh(client: AsyncClient, postgres_url: str) -> None:
    await _register(client)
    await _activate(postgres_url)
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
    )
    refresh_token = login.json()["tokens"]["refresh_token"]

    logout = await client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})
    assert logout.status_code == 204

    refreshed = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refreshed.status_code == 401


async def test_forgot_password_no_enumeration(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "nobody@test.com"},
    )
    assert response.status_code == 202


async def test_verify_invalid_token(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/verify",
        json={"token": "definitely-not-a-real-token"},
    )
    assert response.status_code == 401
