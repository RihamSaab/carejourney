from datetime import date, timedelta
from typing import Any

from httpx import AsyncClient
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from hospital_api.domains.medications.models import MedicationEvent
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


async def _create_care_plan(
    client: AsyncClient, pro_token: str, patient_email: str, title: str = "Plan"
) -> str:
    response = await client.post(
        "/api/v1/care-plans",
        headers={"Authorization": f"Bearer {pro_token}"},
        json={"patient_email": patient_email, "title": title},
    )
    assert response.status_code == 201, response.text
    return str(response.json()["id"])


async def _count_events(postgres_url: str, medication_id: str) -> int:
    engine = create_async_engine(postgres_url)
    sm = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with sm() as session:
            result = await session.execute(
                select(MedicationEvent).where(MedicationEvent.medication_id == medication_id)
            )
            return len(list(result.scalars().all()))
    finally:
        await engine.dispose()


def _med_body(**overrides: Any) -> dict[str, Any]:
    today = date.today()
    body: dict[str, Any] = {
        "name": "Metformin",
        "dosage": "500mg",
        "frequency": {"times_per_day": 2, "hours": ["08:00", "20:00"]},
        "start_at": today.isoformat(),
    }
    body.update(overrides)
    return body


async def test_create_medication_as_patient_forbidden(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-m1@test.com", role="professional", full_name="Dr A"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-m1@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_care_plan(client, pro, "pt-m1@test.com")

    response = await client.post(
        f"/api/v1/care-plans/{plan_id}/medications",
        headers={"Authorization": f"Bearer {pt}"},
        json=_med_body(),
    )
    assert response.status_code == 403


async def test_create_medication_as_unrelated_professional_forbidden(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-m2@test.com", role="professional", full_name="Dr A"
    )
    other_pro = await _login_as(
        client, postgres_url, email="pro-m2b@test.com", role="professional", full_name="Dr B"
    )
    await _login_as(
        client, postgres_url, email="pt-m2@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_care_plan(client, pro, "pt-m2@test.com")

    response = await client.post(
        f"/api/v1/care-plans/{plan_id}/medications",
        headers={"Authorization": f"Bearer {other_pro}"},
        json=_med_body(),
    )
    assert response.status_code == 403


async def test_create_medication_happy_path_materialises_events(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-m3@test.com", role="professional", full_name="Dr A"
    )
    await _login_as(
        client, postgres_url, email="pt-m3@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_care_plan(client, pro, "pt-m3@test.com")

    response = await client.post(
        f"/api/v1/care-plans/{plan_id}/medications",
        headers={"Authorization": f"Bearer {pro}"},
        json=_med_body(),
    )
    assert response.status_code == 201, response.text
    med = response.json()
    assert med["name"] == "Metformin"
    assert med["frequency"]["hours"] == ["08:00", "20:00"]

    event_count = await _count_events(postgres_url, med["id"])
    assert event_count == 2 * 31  # 2 per day, 30-day horizon inclusive of start


async def test_create_medication_with_end_at_before_start_422(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-m4@test.com", role="professional", full_name="Dr A"
    )
    await _login_as(
        client, postgres_url, email="pt-m4@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_care_plan(client, pro, "pt-m4@test.com")

    today = date.today()
    response = await client.post(
        f"/api/v1/care-plans/{plan_id}/medications",
        headers={"Authorization": f"Bearer {pro}"},
        json=_med_body(end_at=(today - timedelta(days=1)).isoformat()),
    )
    assert response.status_code == 422


async def test_create_medication_with_mismatched_hours_422(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-m5@test.com", role="professional", full_name="Dr A"
    )
    await _login_as(
        client, postgres_url, email="pt-m5@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_care_plan(client, pro, "pt-m5@test.com")

    response = await client.post(
        f"/api/v1/care-plans/{plan_id}/medications",
        headers={"Authorization": f"Bearer {pro}"},
        json=_med_body(frequency={"times_per_day": 2, "hours": ["08:00"]}),
    )
    assert response.status_code == 422


async def test_list_medications_as_patient_200(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-m6@test.com", role="professional", full_name="Dr A"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-m6@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_care_plan(client, pro, "pt-m6@test.com")

    await client.post(
        f"/api/v1/care-plans/{plan_id}/medications",
        headers={"Authorization": f"Bearer {pro}"},
        json=_med_body(),
    )

    response = await client.get(
        f"/api/v1/care-plans/{plan_id}/medications",
        headers={"Authorization": f"Bearer {pt}"},
    )
    assert response.status_code == 200
    assert len(response.json()) == 1


async def test_list_medications_as_unrelated_professional_forbidden(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-m7@test.com", role="professional", full_name="Dr A"
    )
    other_pro = await _login_as(
        client, postgres_url, email="pro-m7b@test.com", role="professional", full_name="Dr B"
    )
    await _login_as(
        client, postgres_url, email="pt-m7@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_care_plan(client, pro, "pt-m7@test.com")

    response = await client.get(
        f"/api/v1/care-plans/{plan_id}/medications",
        headers={"Authorization": f"Bearer {other_pro}"},
    )
    assert response.status_code == 403


async def test_patient_lists_today_events_sees_only_own(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-m8@test.com", role="professional", full_name="Dr A"
    )
    pt_a = await _login_as(
        client, postgres_url, email="pt-m8a@test.com", role="patient", full_name="Pt A"
    )
    pt_b = await _login_as(
        client, postgres_url, email="pt-m8b@test.com", role="patient", full_name="Pt B"
    )
    plan_a = await _create_care_plan(client, pro, "pt-m8a@test.com", title="A plan")

    await client.post(
        f"/api/v1/care-plans/{plan_a}/medications",
        headers={"Authorization": f"Bearer {pro}"},
        json=_med_body(),
    )

    a_events = await client.get(
        "/api/v1/medication-events?date=today",
        headers={"Authorization": f"Bearer {pt_a}"},
    )
    assert a_events.status_code == 200
    assert len(a_events.json()) == 2  # 2 doses today

    b_events = await client.get(
        "/api/v1/medication-events?date=today",
        headers={"Authorization": f"Bearer {pt_b}"},
    )
    assert b_events.status_code == 200
    assert b_events.json() == []


async def test_patient_marks_event_taken(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-m9@test.com", role="professional", full_name="Dr A"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-m9@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_care_plan(client, pro, "pt-m9@test.com")

    await client.post(
        f"/api/v1/care-plans/{plan_id}/medications",
        headers={"Authorization": f"Bearer {pro}"},
        json=_med_body(),
    )

    events = await client.get(
        "/api/v1/medication-events?date=today",
        headers={"Authorization": f"Bearer {pt}"},
    )
    event_id = events.json()[0]["id"]

    patched = await client.patch(
        f"/api/v1/medication-events/{event_id}",
        headers={"Authorization": f"Bearer {pt}"},
        json={"state": "taken"},
    )
    assert patched.status_code == 200
    body = patched.json()
    assert body["state"] == "taken"
    assert body["acted_at"] is not None


async def test_patch_event_by_different_patient_forbidden(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-m10@test.com", role="professional", full_name="Dr A"
    )
    pt_a = await _login_as(
        client, postgres_url, email="pt-m10a@test.com", role="patient", full_name="Pt A"
    )
    pt_b = await _login_as(
        client, postgres_url, email="pt-m10b@test.com", role="patient", full_name="Pt B"
    )
    plan_id = await _create_care_plan(client, pro, "pt-m10a@test.com")

    await client.post(
        f"/api/v1/care-plans/{plan_id}/medications",
        headers={"Authorization": f"Bearer {pro}"},
        json=_med_body(),
    )
    events = await client.get(
        "/api/v1/medication-events?date=today",
        headers={"Authorization": f"Bearer {pt_a}"},
    )
    event_id = events.json()[0]["id"]

    response = await client.patch(
        f"/api/v1/medication-events/{event_id}",
        headers={"Authorization": f"Bearer {pt_b}"},
        json={"state": "taken"},
    )
    assert response.status_code == 403


async def test_patch_event_already_recorded_409(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-m11@test.com", role="professional", full_name="Dr A"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-m11@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_care_plan(client, pro, "pt-m11@test.com")

    await client.post(
        f"/api/v1/care-plans/{plan_id}/medications",
        headers={"Authorization": f"Bearer {pro}"},
        json=_med_body(),
    )
    events = await client.get(
        "/api/v1/medication-events?date=today",
        headers={"Authorization": f"Bearer {pt}"},
    )
    event_id = events.json()[0]["id"]

    first = await client.patch(
        f"/api/v1/medication-events/{event_id}",
        headers={"Authorization": f"Bearer {pt}"},
        json={"state": "taken"},
    )
    assert first.status_code == 200

    second = await client.patch(
        f"/api/v1/medication-events/{event_id}",
        headers={"Authorization": f"Bearer {pt}"},
        json={"state": "skipped"},
    )
    assert second.status_code == 409


async def test_patch_event_to_scheduled_422(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-m12@test.com", role="professional", full_name="Dr A"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-m12@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_care_plan(client, pro, "pt-m12@test.com")

    await client.post(
        f"/api/v1/care-plans/{plan_id}/medications",
        headers={"Authorization": f"Bearer {pro}"},
        json=_med_body(),
    )
    events = await client.get(
        "/api/v1/medication-events?date=today",
        headers={"Authorization": f"Bearer {pt}"},
    )
    event_id = events.json()[0]["id"]

    response = await client.patch(
        f"/api/v1/medication-events/{event_id}",
        headers={"Authorization": f"Bearer {pt}"},
        json={"state": "scheduled"},
    )
    assert response.status_code == 422
