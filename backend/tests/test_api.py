import pytest

PAYLOAD = {
    "prompt": "Explain how to reverse a list in Python.",
    "response_a": "Use list.reverse() to change a list in place.",
    "response_b": "Use list(reversed(items)) when you want a new list and preserve the original.",
}


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "evalforge-api"}


@pytest.mark.asyncio
async def test_create_fetch_and_list_evaluation(client):
    created = await client.post("/api/v1/evaluations", json=PAYLOAD)
    assert created.status_code == 201
    body = created.json()
    assert body["winner"] in {"A", "B", "tie"}
    assert body["engine"] == "local-rubric"
    assert set(body["candidate_a"]["scores"]) == {
        "correctness",
        "code_quality",
        "efficiency",
        "helpfulness",
        "safety",
    }

    fetched = await client.get(f"/api/v1/evaluations/{body['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["id"] == body["id"]

    history = await client.get("/api/v1/evaluations")
    assert history.status_code == 200
    assert len(history.json()) == 1
    assert history.json()[0]["id"] == body["id"]


@pytest.mark.asyncio
async def test_missing_evaluation_returns_404(client):
    response = await client.get("/api/v1/evaluations/does-not-exist")
    assert response.status_code == 404
