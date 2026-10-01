from datetime import datetime, timedelta, timezone

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


async def _create_plan(client: AsyncClient, pro: str, patient_email: str) -> str:
    response = await client.post(
        "/api/v1/care-plans",
        headers={"Authorization": f"Bearer {pro}"},
        json={"patient_email": patient_email, "title": "Plan"},
    )
    assert response.status_code == 201, response.text
    return str(response.json()["id"])


def _future_iso(days: int = 3, hours: int = 10) -> str:
    when = datetime.now(tz=timezone.utc) + timedelta(days=days, hours=hours)
    return when.replace(microsecond=0).isoformat()


def _past_iso(days: int = 3) -> str:
    when = datetime.now(tz=timezone.utc) - timedelta(days=days)
    return when.replace(microsecond=0).isoformat()


async def _create_appointment(
    client: AsyncClient, token: str, plan_id: str, **overrides: object
) -> dict[str, object]:
    body: dict[str, object] = {
        "title": "Checkup",
        "scheduled_at": _future_iso(),
        "duration_minutes": 30,
        "location_kind": "in_person",
    }
    body.update(overrides)
    response = await client.post(
        f"/api/v1/care-plans/{plan_id}/appointments",
        headers={"Authorization": f"Bearer {token}"},
        json=body,
    )
    assert response.status_code == 201, response.text
    appt: dict[str, object] = response.json()
    return appt


async def test_create_appointment_as_professional_defaults_scheduled(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-a1@test.com", role="professional", full_name="Dr A"
    )
    await _login_as(
        client, postgres_url, email="pt-a1@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_plan(client, pro, "pt-a1@test.com")

    appt = await _create_appointment(client, pro, plan_id, title="Follow-up")
    assert appt["title"] == "Follow-up"
    assert appt["status"] == "scheduled"
    assert appt["duration_minutes"] == 30
    assert appt["location_kind"] == "in_person"
    assert appt["is_past"] is False
    assert appt["care_plan_title"] == "Plan"


async def test_create_appointment_as_patient_defaults_requested(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-a2@test.com", role="professional", full_name="Dr A"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-a2@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_plan(client, pro, "pt-a2@test.com")

    appt = await _create_appointment(
        client, pt, plan_id, title="Need to talk", location_kind="video"
    )
    assert appt["status"] == "requested"
    assert appt["location_kind"] == "video"


async def test_create_appointment_as_unrelated_pro_forbidden(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-a3@test.com", role="professional", full_name="Dr A"
    )
    other = await _login_as(
        client, postgres_url, email="pro-a3b@test.com", role="professional", full_name="Dr B"
    )
    await _login_as(
        client, postgres_url, email="pt-a3@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_plan(client, pro, "pt-a3@test.com")

    response = await client.post(
        f"/api/v1/care-plans/{plan_id}/appointments",
        headers={"Authorization": f"Bearer {other}"},
        json={
            "title": "Hostile",
            "scheduled_at": _future_iso(),
            "duration_minutes": 30,
            "location_kind": "in_person",
        },
    )
    assert response.status_code == 403


async def test_appointment_is_past_flag_for_overdue_scheduled(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-a4@test.com", role="professional", full_name="Dr A"
    )
    await _login_as(
        client, postgres_url, email="pt-a4@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_plan(client, pro, "pt-a4@test.com")

    await _create_appointment(client, pro, plan_id, scheduled_at=_past_iso())

    listing = await client.get(
        f"/api/v1/care-plans/{plan_id}/appointments",
        headers={"Authorization": f"Bearer {pro}"},
    )
    assert listing.status_code == 200
    data = listing.json()
    assert len(data) == 1
    assert data[0]["is_past"] is True


async def test_list_appointments_as_unrelated_pro_forbidden(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-a5@test.com", role="professional", full_name="Dr A"
    )
    other = await _login_as(
        client, postgres_url, email="pro-a5b@test.com", role="professional", full_name="Dr B"
    )
    await _login_as(
        client, postgres_url, email="pt-a5@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_plan(client, pro, "pt-a5@test.com")

    response = await client.get(
        f"/api/v1/care-plans/{plan_id}/appointments",
        headers={"Authorization": f"Bearer {other}"},
    )
    assert response.status_code == 403


async def test_upcoming_as_patient_filters_terminal(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-a6@test.com", role="professional", full_name="Dr A"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-a6@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_plan(client, pro, "pt-a6@test.com")

    live = await _create_appointment(client, pro, plan_id, title="Live")
    cancelled = await _create_appointment(client, pro, plan_id, title="To cancel")
    await client.patch(
        f"/api/v1/appointments/{cancelled['id']}",
        headers={"Authorization": f"Bearer {pro}"},
        json={"status": "cancelled"},
    )

    upcoming = await client.get(
        "/api/v1/appointments?scope=upcoming",
        headers={"Authorization": f"Bearer {pt}"},
    )
    assert upcoming.status_code == 200
    titles = [a["title"] for a in upcoming.json()]
    assert "Live" in titles
    assert "To cancel" not in titles
    _ = live


async def test_upcoming_as_professional_forbidden(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-a7@test.com", role="professional", full_name="Dr A"
    )
    response = await client.get(
        "/api/v1/appointments?scope=upcoming",
        headers={"Authorization": f"Bearer {pro}"},
    )
    assert response.status_code == 403


async def test_professional_can_confirm_requested(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-a8@test.com", role="professional", full_name="Dr A"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-a8@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_plan(client, pro, "pt-a8@test.com")
    appt = await _create_appointment(client, pt, plan_id)
    assert appt["status"] == "requested"

    response = await client.patch(
        f"/api/v1/appointments/{appt['id']}",
        headers={"Authorization": f"Bearer {pro}"},
        json={"status": "scheduled"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "scheduled"


async def test_patient_can_cancel_scheduled(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-a9@test.com", role="professional", full_name="Dr A"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-a9@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_plan(client, pro, "pt-a9@test.com")
    appt = await _create_appointment(client, pro, plan_id)

    response = await client.patch(
        f"/api/v1/appointments/{appt['id']}",
        headers={"Authorization": f"Bearer {pt}"},
        json={"status": "cancelled"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"


async def test_patient_cannot_mark_completed(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-a10@test.com", role="professional", full_name="Dr A"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-a10@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_plan(client, pro, "pt-a10@test.com")
    appt = await _create_appointment(client, pro, plan_id)

    response = await client.patch(
        f"/api/v1/appointments/{appt['id']}",
        headers={"Authorization": f"Bearer {pt}"},
        json={"status": "completed"},
    )
    assert response.status_code == 422


async def test_patient_cannot_edit_fields(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-a11@test.com", role="professional", full_name="Dr A"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-a11@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_plan(client, pro, "pt-a11@test.com")
    appt = await _create_appointment(client, pro, plan_id)

    response = await client.patch(
        f"/api/v1/appointments/{appt['id']}",
        headers={"Authorization": f"Bearer {pt}"},
        json={"title": "Hacked"},
    )
    assert response.status_code == 422


async def test_professional_can_edit_and_mark_no_show(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-a12@test.com", role="professional", full_name="Dr A"
    )
    await _login_as(
        client, postgres_url, email="pt-a12@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_plan(client, pro, "pt-a12@test.com")
    appt = await _create_appointment(client, pro, plan_id)

    edited = await client.patch(
        f"/api/v1/appointments/{appt['id']}",
        headers={"Authorization": f"Bearer {pro}"},
        json={"title": "Renamed", "duration_minutes": 60},
    )
    assert edited.status_code == 200
    assert edited.json()["title"] == "Renamed"
    assert edited.json()["duration_minutes"] == 60

    no_show = await client.patch(
        f"/api/v1/appointments/{appt['id']}",
        headers={"Authorization": f"Bearer {pro}"},
        json={"status": "no_show"},
    )
    assert no_show.status_code == 200
    assert no_show.json()["status"] == "no_show"


async def test_patient_cannot_cancel_completed(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-a13@test.com", role="professional", full_name="Dr A"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-a13@test.com", role="patient", full_name="Pt A"
    )
    plan_id = await _create_plan(client, pro, "pt-a13@test.com")
    appt = await _create_appointment(client, pro, plan_id)
    await client.patch(
        f"/api/v1/appointments/{appt['id']}",
        headers={"Authorization": f"Bearer {pro}"},
        json={"status": "completed"},
    )

    response = await client.patch(
        f"/api/v1/appointments/{appt['id']}",
        headers={"Authorization": f"Bearer {pt}"},
        json={"status": "cancelled"},
    )
    assert response.status_code == 422


async def test_patch_as_unrelated_user_forbidden(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-a14@test.com", role="professional", full_name="Dr A"
    )
    await _login_as(
        client, postgres_url, email="pt-a14@test.com", role="patient", full_name="Pt A"
    )
    other = await _login_as(
        client, postgres_url, email="pt-a14b@test.com", role="patient", full_name="Other"
    )
    plan_id = await _create_plan(client, pro, "pt-a14@test.com")
    appt = await _create_appointment(client, pro, plan_id)

    response = await client.patch(
        f"/api/v1/appointments/{appt['id']}",
        headers={"Authorization": f"Bearer {other}"},
        json={"status": "cancelled"},
    )
    assert response.status_code == 403
