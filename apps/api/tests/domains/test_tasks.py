from datetime import date, timedelta

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


async def _create_task(
    client: AsyncClient, pro: str, plan_id: str, **overrides: object
) -> dict[str, object]:
    body: dict[str, object] = {"title": "Follow up"}
    body.update(overrides)
    response = await client.post(
        f"/api/v1/care-plans/{plan_id}/tasks",
        headers={"Authorization": f"Bearer {pro}"},
        json=body,
    )
    assert response.status_code == 201, response.text
    task: dict[str, object] = response.json()
    return task


async def test_create_task_as_patient_forbidden(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-t1@test.com", role="professional", full_name="Dr T"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-t1@test.com", role="patient", full_name="Pt T"
    )
    plan_id = await _create_plan(client, pro, "pt-t1@test.com")

    response = await client.post(
        f"/api/v1/care-plans/{plan_id}/tasks",
        headers={"Authorization": f"Bearer {pt}"},
        json={"title": "Should fail"},
    )
    assert response.status_code == 403


async def test_create_task_as_unrelated_pro_forbidden(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-t2@test.com", role="professional", full_name="Dr A"
    )
    other = await _login_as(
        client, postgres_url, email="pro-t2b@test.com", role="professional", full_name="Dr B"
    )
    await _login_as(
        client, postgres_url, email="pt-t2@test.com", role="patient", full_name="Pt T"
    )
    plan_id = await _create_plan(client, pro, "pt-t2@test.com")

    response = await client.post(
        f"/api/v1/care-plans/{plan_id}/tasks",
        headers={"Authorization": f"Bearer {other}"},
        json={"title": "Hostile"},
    )
    assert response.status_code == 403


async def test_create_task_happy_path_future_due(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-t3@test.com", role="professional", full_name="Dr T"
    )
    await _login_as(
        client, postgres_url, email="pt-t3@test.com", role="patient", full_name="Pt T"
    )
    plan_id = await _create_plan(client, pro, "pt-t3@test.com")

    future = (date.today() + timedelta(days=3)).isoformat()
    task = await _create_task(
        client, pro, plan_id, title="Blood test", due_at=future, priority="high"
    )
    assert task["title"] == "Blood test"
    assert task["due_at"] == future
    assert task["priority"] == "high"
    assert task["status"] == "pending"
    assert task["is_overdue"] is False
    assert task["care_plan_title"] == "Plan"


async def test_task_is_overdue_in_list_when_past_due(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-t4@test.com", role="professional", full_name="Dr T"
    )
    await _login_as(
        client, postgres_url, email="pt-t4@test.com", role="patient", full_name="Pt T"
    )
    plan_id = await _create_plan(client, pro, "pt-t4@test.com")

    past = (date.today() - timedelta(days=2)).isoformat()
    await _create_task(client, pro, plan_id, title="Was due", due_at=past)

    listing = await client.get(
        f"/api/v1/care-plans/{plan_id}/tasks",
        headers={"Authorization": f"Bearer {pro}"},
    )
    assert listing.status_code == 200
    data = listing.json()
    assert len(data) == 1
    assert data[0]["is_overdue"] is True


async def test_list_tasks_as_unrelated_pro_forbidden(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-t5@test.com", role="professional", full_name="Dr T"
    )
    other = await _login_as(
        client, postgres_url, email="pro-t5b@test.com", role="professional", full_name="Dr B"
    )
    await _login_as(
        client, postgres_url, email="pt-t5@test.com", role="patient", full_name="Pt T"
    )
    plan_id = await _create_plan(client, pro, "pt-t5@test.com")

    response = await client.get(
        f"/api/v1/care-plans/{plan_id}/tasks",
        headers={"Authorization": f"Bearer {other}"},
    )
    assert response.status_code == 403


async def test_upcoming_tasks_as_patient_filters_terminal_states(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-t6@test.com", role="professional", full_name="Dr T"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-t6@test.com", role="patient", full_name="Pt T"
    )
    plan_id = await _create_plan(client, pro, "pt-t6@test.com")

    pending = await _create_task(client, pro, plan_id, title="Pending")
    cancelled = await _create_task(client, pro, plan_id, title="To cancel")
    await client.patch(
        f"/api/v1/tasks/{cancelled['id']}",
        headers={"Authorization": f"Bearer {pro}"},
        json={"status": "cancelled"},
    )

    upcoming = await client.get(
        "/api/v1/tasks?scope=upcoming",
        headers={"Authorization": f"Bearer {pt}"},
    )
    assert upcoming.status_code == 200
    titles = [t["title"] for t in upcoming.json()]
    assert "Pending" in titles
    assert "To cancel" not in titles
    _ = pending  # anchor


async def test_upcoming_tasks_as_professional_forbidden(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-t7@test.com", role="professional", full_name="Dr T"
    )
    response = await client.get(
        "/api/v1/tasks?scope=upcoming",
        headers={"Authorization": f"Bearer {pro}"},
    )
    assert response.status_code == 403


async def test_patient_can_transition_pending_to_in_progress(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-t8@test.com", role="professional", full_name="Dr T"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-t8@test.com", role="patient", full_name="Pt T"
    )
    plan_id = await _create_plan(client, pro, "pt-t8@test.com")
    task = await _create_task(client, pro, plan_id)

    response = await client.patch(
        f"/api/v1/tasks/{task['id']}",
        headers={"Authorization": f"Bearer {pt}"},
        json={"status": "in_progress"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"


async def test_patient_can_transition_in_progress_to_completed(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-t9@test.com", role="professional", full_name="Dr T"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-t9@test.com", role="patient", full_name="Pt T"
    )
    plan_id = await _create_plan(client, pro, "pt-t9@test.com")
    task = await _create_task(client, pro, plan_id)

    await client.patch(
        f"/api/v1/tasks/{task['id']}",
        headers={"Authorization": f"Bearer {pt}"},
        json={"status": "in_progress"},
    )
    done = await client.patch(
        f"/api/v1/tasks/{task['id']}",
        headers={"Authorization": f"Bearer {pt}"},
        json={"status": "completed"},
    )
    assert done.status_code == 200
    assert done.json()["status"] == "completed"


async def test_patient_cannot_cancel_task(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-t10@test.com", role="professional", full_name="Dr T"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-t10@test.com", role="patient", full_name="Pt T"
    )
    plan_id = await _create_plan(client, pro, "pt-t10@test.com")
    task = await _create_task(client, pro, plan_id)

    response = await client.patch(
        f"/api/v1/tasks/{task['id']}",
        headers={"Authorization": f"Bearer {pt}"},
        json={"status": "cancelled"},
    )
    assert response.status_code == 422


async def test_patient_cannot_edit_fields(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-t11@test.com", role="professional", full_name="Dr T"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-t11@test.com", role="patient", full_name="Pt T"
    )
    plan_id = await _create_plan(client, pro, "pt-t11@test.com")
    task = await _create_task(client, pro, plan_id)

    response = await client.patch(
        f"/api/v1/tasks/{task['id']}",
        headers={"Authorization": f"Bearer {pt}"},
        json={"title": "Hacked"},
    )
    assert response.status_code == 422


async def test_professional_can_edit_fields_and_cancel(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-t12@test.com", role="professional", full_name="Dr T"
    )
    await _login_as(
        client, postgres_url, email="pt-t12@test.com", role="patient", full_name="Pt T"
    )
    plan_id = await _create_plan(client, pro, "pt-t12@test.com")
    task = await _create_task(client, pro, plan_id)

    edited = await client.patch(
        f"/api/v1/tasks/{task['id']}",
        headers={"Authorization": f"Bearer {pro}"},
        json={"title": "Renamed", "priority": "high"},
    )
    assert edited.status_code == 200
    assert edited.json()["title"] == "Renamed"
    assert edited.json()["priority"] == "high"

    cancelled = await client.patch(
        f"/api/v1/tasks/{task['id']}",
        headers={"Authorization": f"Bearer {pro}"},
        json={"status": "cancelled"},
    )
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"


async def test_patient_cannot_reopen_completed_task(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-t13@test.com", role="professional", full_name="Dr T"
    )
    pt = await _login_as(
        client, postgres_url, email="pt-t13@test.com", role="patient", full_name="Pt T"
    )
    plan_id = await _create_plan(client, pro, "pt-t13@test.com")
    task = await _create_task(client, pro, plan_id)

    await client.patch(
        f"/api/v1/tasks/{task['id']}",
        headers={"Authorization": f"Bearer {pt}"},
        json={"status": "in_progress"},
    )
    await client.patch(
        f"/api/v1/tasks/{task['id']}",
        headers={"Authorization": f"Bearer {pt}"},
        json={"status": "completed"},
    )
    response = await client.patch(
        f"/api/v1/tasks/{task['id']}",
        headers={"Authorization": f"Bearer {pt}"},
        json={"status": "in_progress"},
    )
    assert response.status_code == 422


async def test_patch_as_unrelated_user_forbidden(
    client: AsyncClient, postgres_url: str
) -> None:
    pro = await _login_as(
        client, postgres_url, email="pro-t14@test.com", role="professional", full_name="Dr T"
    )
    await _login_as(
        client, postgres_url, email="pt-t14@test.com", role="patient", full_name="Pt T"
    )
    other = await _login_as(
        client, postgres_url, email="pt-t14b@test.com", role="patient", full_name="Other Pt"
    )
    plan_id = await _create_plan(client, pro, "pt-t14@test.com")
    task = await _create_task(client, pro, plan_id)

    response = await client.patch(
        f"/api/v1/tasks/{task['id']}",
        headers={"Authorization": f"Bearer {other}"},
        json={"status": "in_progress"},
    )
    assert response.status_code == 403
