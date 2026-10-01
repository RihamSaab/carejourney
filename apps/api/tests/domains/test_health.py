from httpx import AsyncClient


async def test_health_ok(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "environment": "local"}


async def test_health_live(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health/live")

    assert response.status_code == 200
    assert response.json() == {"status": "alive"}


async def test_health_ready_ok(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health/ready")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ready"
    assert body["checks"]["database"] is True


async def test_health_db_ok(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health/db")

    assert response.status_code == 200
    body = response.json()
    assert body["db"] == "ok"
    assert isinstance(body["latency_ms"], int | float)
    assert body["latency_ms"] >= 0


async def test_request_id_echoed_when_provided(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health", headers={"X-Request-Id": "test-abc-123"})

    assert response.status_code == 200
    assert response.headers["x-request-id"] == "test-abc-123"


async def test_request_id_generated_when_missing(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert "x-request-id" in response.headers
    assert len(response.headers["x-request-id"]) > 0
