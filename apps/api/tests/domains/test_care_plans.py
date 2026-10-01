from httpx import AsyncClient
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

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


async def _login_as(
    client: AsyncClient, postgres_url: str, *, email: str, role: str, full_name: str
) -> str:
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": PASSWORD,
            "full_name": full_name,
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


async def test_list_care_plans_unauthenticated(client: AsyncClient) -> None:
    response = await client.get("/api/v1/care-plans")
    assert response.status_code == 401


async def test_list_care_plans_as_patient_empty(
    client: AsyncClient, postgres_url: str
) -> None:
    access = await _login_as(
        client, postgres_url, email="patient-empty@test.com", role="patient", full_name="Pt Empty"
    )
    response = await client.get(
        "/api/v1/care-plans", headers={"Authorization": f"Bearer {access}"}
    )
    assert response.status_code == 200
    assert response.json() == []


async def test_create_care_plan_as_patient_forbidden(
    client: AsyncClient, postgres_url: str
) -> None:
    access = await _login_as(
        client, postgres_url, email="p-not-pro@test.com", role="patient", full_name="Pt Nopro"
    )
    response = await client.post(
        "/api/v1/care-plans",
        headers={"Authorization": f"Bearer {access}"},
        json={"patient_email": "someone@test.com", "title": "Test"},
    )
    assert response.status_code == 403


async def test_create_care_plan_patient_not_found(
    client: AsyncClient, postgres_url: str
) -> None:
    access = await _login_as(
        client, postgres_url, email="pro-missing@test.com", role="professional", full_name="Dr P"
    )
    response = await client.post(
        "/api/v1/care-plans",
        headers={"Authorization": f"Bearer {access}"},
        json={"patient_email": "nobody@test.com", "title": "Will fail"},
    )
    assert response.status_code == 404


async def test_full_create_and_visibility_flow(
    client: AsyncClient, postgres_url: str
) -> None:
    pro_access = await _login_as(
        client, postgres_url, email="dr-create@test.com", role="professional", full_name="Dr Create"
    )
    patient_access = await _login_as(
        client,
        postgres_url,
        email="pt-visible@test.com",
        role="patient",
        full_name="Pt Visible",
    )

    create = await client.post(
        "/api/v1/care-plans",
        headers={"Authorization": f"Bearer {pro_access}"},
        json={
            "patient_email": "pt-visible@test.com",
            "title": "Post-op recovery",
            "description": "Follow-up plan",
            "status": "active",
        },
    )
    assert create.status_code == 201, create.text
    plan = create.json()
    assert plan["title"] == "Post-op recovery"
    assert plan["patient_full_name"] == "Pt Visible"
    assert plan["patient_email"] == "pt-visible@test.com"
    assert plan["professional_full_name"] == "Dr Create"
    assert plan["status"] == "active"

    pro_list = await client.get(
        "/api/v1/care-plans", headers={"Authorization": f"Bearer {pro_access}"}
    )
    assert len(pro_list.json()) == 1

    patient_list = await client.get(
        "/api/v1/care-plans", headers={"Authorization": f"Bearer {patient_access}"}
    )
    assert len(patient_list.json()) == 1
    assert patient_list.json()[0]["id"] == plan["id"]


async def test_get_by_id_as_unrelated_user_forbidden(
    client: AsyncClient, postgres_url: str
) -> None:
    pro_access = await _login_as(
        client, postgres_url, email="dr-a@test.com", role="professional", full_name="Dr A"
    )
    await _login_as(
        client, postgres_url, email="pt-a@test.com", role="patient", full_name="Pt A"
    )
    other_pro_access = await _login_as(
        client, postgres_url, email="dr-b@test.com", role="professional", full_name="Dr B"
    )

    created = await client.post(
        "/api/v1/care-plans",
        headers={"Authorization": f"Bearer {pro_access}"},
        json={"patient_email": "pt-a@test.com", "title": "Private plan"},
    )
    plan_id = created.json()["id"]

    response = await client.get(
        f"/api/v1/care-plans/{plan_id}",
        headers={"Authorization": f"Bearer {other_pro_access}"},
    )
    assert response.status_code == 403


async def test_patch_as_creator(client: AsyncClient, postgres_url: str) -> None:
    pro_access = await _login_as(
        client, postgres_url, email="dr-edit@test.com", role="professional", full_name="Dr Edit"
    )
    await _login_as(
        client, postgres_url, email="pt-edit@test.com", role="patient", full_name="Pt Edit"
    )

    created = await client.post(
        "/api/v1/care-plans",
        headers={"Authorization": f"Bearer {pro_access}"},
        json={"patient_email": "pt-edit@test.com", "title": "Original"},
    )
    plan_id = created.json()["id"]

    patched = await client.patch(
        f"/api/v1/care-plans/{plan_id}",
        headers={"Authorization": f"Bearer {pro_access}"},
        json={"title": "Updated", "status": "active"},
    )
    assert patched.status_code == 200
    body = patched.json()
    assert body["title"] == "Updated"
    assert body["status"] == "active"


async def test_patch_as_patient_forbidden(
    client: AsyncClient, postgres_url: str
) -> None:
    pro_access = await _login_as(
        client, postgres_url, email="dr-ro@test.com", role="professional", full_name="Dr RO"
    )
    patient_access = await _login_as(
        client, postgres_url, email="pt-ro@test.com", role="patient", full_name="Pt RO"
    )

    created = await client.post(
        "/api/v1/care-plans",
        headers={"Authorization": f"Bearer {pro_access}"},
        json={"patient_email": "pt-ro@test.com", "title": "Read-only test"},
    )
    plan_id = created.json()["id"]

    patched = await client.patch(
        f"/api/v1/care-plans/{plan_id}",
        headers={"Authorization": f"Bearer {patient_access}"},
        json={"title": "Hacker"},
    )
    assert patched.status_code == 403


async def test_patch_invalid_status(client: AsyncClient, postgres_url: str) -> None:
    pro_access = await _login_as(
        client, postgres_url, email="dr-bad@test.com", role="professional", full_name="Dr B"
    )
    await _login_as(
        client, postgres_url, email="pt-bad@test.com", role="patient", full_name="Pt B"
    )

    created = await client.post(
        "/api/v1/care-plans",
        headers={"Authorization": f"Bearer {pro_access}"},
        json={"patient_email": "pt-bad@test.com", "title": "Will try bad status"},
    )
    plan_id = created.json()["id"]

    response = await client.patch(
        f"/api/v1/care-plans/{plan_id}",
        headers={"Authorization": f"Bearer {pro_access}"},
        json={"status": "nonexistent"},
    )
    assert response.status_code == 422


async def test_create_with_dates_out_of_order_422(
    client: AsyncClient, postgres_url: str
) -> None:
    pro_access = await _login_as(
        client, postgres_url, email="dr-dates@test.com", role="professional", full_name="Dr D"
    )
    await _login_as(
        client, postgres_url, email="pt-dates@test.com", role="patient", full_name="Pt D"
    )

    response = await client.post(
        "/api/v1/care-plans",
        headers={"Authorization": f"Bearer {pro_access}"},
        json={
            "patient_email": "pt-dates@test.com",
            "title": "Bad dates",
            "start_at": "2026-01-15",
            "end_at": "2026-01-01",
        },
    )
    assert response.status_code == 422
