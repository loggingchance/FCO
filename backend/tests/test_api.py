from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_estimate_schema():
    payload = {
        "geography": {"type": "state", "states": ["WI"], "counties": []},
        "estimate_type": "total_carbon",
        "filters": {},
        "grouping": "carbon_pool",
    }
    res = client.post("/api/estimate", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["headline"]["unit"] == "tons CO2e"
    assert len(body["rows"]) >= 3
    assert body["warnings"]


def test_wizard_routes_stand_to_fvs():
    res = client.post(
        "/api/wizard/route",
        json={
            "geography": "Stand or treatment unit",
            "question": "Management scenario",
            "timeframe": "Future management scenario",
            "data": "Stand inventory",
            "precision": "Project-level analysis",
        },
    )
    assert res.status_code == 200
    assert "FVS" in res.json()["module"]

