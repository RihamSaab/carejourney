from httpx import AsyncClient
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from hospital_api.domains.patients.models import Patient
from hospital_api.domains.users.models import User, UserStatus

PASSWORD = "long-enough-pw-123"


async def _activate(postgres_url: str, email: str) -> None:
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


async def _login(
    client: AsyncClient, postgres_url: str, *, email: str, role: str
) -> str:
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": PASSWORD,
            "full_name": "Test User",
            "role": role,
        },
    )
    assert reg.status_code == 201, reg.text

    await _activate(postgres_url, email)

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": PASSWORD},
    )
    assert login.status_code == 200, login.text
    return str(login.json()["tokens"]["access_token"])


async def _get_patient_row(postgres_url: str, email: str) -> Patient | None:
    engine = create_async_engine(postgres_url)
    sm = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with sm() as session:
            user = (
                await session.execute(select(User).where(User.email == email))
            ).scalar_one()
            return await session.get(Patient, user.id)
    finally:
        await engine.dispose()


async def test_patients_me_unauthenticated(client: AsyncClient) -> None:
    response = await client.get("/api/v1/patients/me")
    assert response.status_code == 401


async def test_patients_me_forbidden_for_professional(
    client: AsyncClient, postgres_url: str
) -> None:
    access = await _login(client, postgres_url, email="pro@test.com", role="professional")

    response = await client.get(
        "/api/v1/patients/me", headers={"Authorization": f"Bearer {access}"}
    )
    assert response.status_code == 403


async def test_patients_me_returns_defaults_for_patient(
    client: AsyncClient, postgres_url: str
) -> None:
    access = await _login(client, postgres_url, email="p1@test.com", role="patient")

    response = await client.get(
        "/api/v1/patients/me", headers={"Authorization": f"Bearer {access}"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "p1@test.com"
    assert body["role"] == "patient"
    assert body["timezone"] == "UTC"
    assert body["preferred_language"] == "en"
    assert body["date_of_birth"] is None
    assert body["phone"] is None
    assert body["emergency_contact"] is None


async def test_patch_patients_me_full_payload(
    client: AsyncClient, postgres_url: str
) -> None:
    access = await _login(client, postgres_url, email="p2@test.com", role="patient")

    response = await client.patch(
        "/api/v1/patients/me",
        headers={"Authorization": f"Bearer {access}"},
        json={
            "date_of_birth": "1990-05-14",
            "phone": "+966500000000",
            "timezone": "Asia/Riyadh",
            "preferred_language": "ar",
            "emergency_contact": {
                "name": "Jane Doe",
                "phone": "+966500000001",
                "relationship": "Spouse",
            },
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["date_of_birth"] == "1990-05-14"
    assert body["phone"] == "+966500000000"
    assert body["timezone"] == "Asia/Riyadh"
    assert body["preferred_language"] == "ar"
    assert body["emergency_contact"] == {
        "name": "Jane Doe",
        "phone": "+966500000001",
        "relationship": "Spouse",
    }


async def test_patch_patients_me_partial_only_touches_provided_fields(
    client: AsyncClient, postgres_url: str
) -> None:
    access = await _login(client, postgres_url, email="p3@test.com", role="patient")

    first = await client.patch(
        "/api/v1/patients/me",
        headers={"Authorization": f"Bearer {access}"},
        json={"timezone": "Europe/London", "preferred_language": "ar"},
    )
    assert first.status_code == 200
    assert first.json()["timezone"] == "Europe/London"
    assert first.json()["preferred_language"] == "ar"

    second = await client.patch(
        "/api/v1/patients/me",
        headers={"Authorization": f"Bearer {access}"},
        json={"phone": "+447700900000"},
    )
    assert second.status_code == 200
    body = second.json()
    assert body["phone"] == "+447700900000"
    assert body["timezone"] == "Europe/London"
    assert body["preferred_language"] == "ar"


async def test_patch_patients_me_invalid_timezone(
    client: AsyncClient, postgres_url: str
) -> None:
    access = await _login(client, postgres_url, email="p4@test.com", role="patient")

    response = await client.patch(
        "/api/v1/patients/me",
        headers={"Authorization": f"Bearer {access}"},
        json={"timezone": "Fake/NotReal"},
    )
    assert response.status_code == 422


async def test_register_patient_creates_patient_row(
    client: AsyncClient, postgres_url: str
) -> None:
    email = "autocreate@test.com"
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": PASSWORD,
            "full_name": "Auto Create",
            "role": "patient",
        },
    )
    assert reg.status_code == 201

    patient = await _get_patient_row(postgres_url, email)
    assert patient is not None
    assert patient.timezone == "UTC"
    assert patient.preferred_language == "en"


async def test_register_professional_does_not_create_patient_row(
    client: AsyncClient, postgres_url: str
) -> None:
    email = "noauto@test.com"
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": PASSWORD,
            "full_name": "Pro",
            "role": "professional",
        },
    )
    assert reg.status_code == 201

    patient = await _get_patient_row(postgres_url, email)
    assert patient is None
