from fastapi.testclient import TestClient
import httpx
from app.main import app
from app.models.schemas import EstimateRequest
from app.services.fia_api import FiaApiService

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


def test_live_fia_forest_area_normalization():
    async def handler(request: httpx.Request):
        assert request.url.path.endswith("/fullreport")
        return httpx.Response(
            200,
            json={
                "estimates": [
                    {
                        "ESTIMATE": 17_100_000,
                        "SE": 500_000,
                        "SE_PERCENT": 2.92,
                        "VARIANCE": 250_000_000_000,
                        "PLOT_COUNT": 2450,
                    }
                ]
            },
        )

    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http_client:
            service = FiaApiService("https://example.test/fiadb-api", http_client=http_client)
            request = EstimateRequest.model_validate(
                {
                    "geography": {"type": "state", "states": ["WI"], "counties": []},
                    "estimate_type": "forest_area",
                    "filters": {},
                    "grouping": "state",
                    "evaluation_year": 2023,
                    "live_data": True,
                }
            )
            return await service.estimate(request)

    import asyncio

    result = asyncio.run(run())
    assert result.source_mode == "live"
    assert result.headline.value == 17_100_000
    assert result.rows[0].standard_error == 500_000
    assert result.rows[0].plot_count == 2450
    assert result.evaluation_year == 2023


def test_live_fia_rejects_unvalidated_grouping():
    service = FiaApiService("https://example.test/fiadb-api")
    request = EstimateRequest.model_validate(
        {
            "geography": {"type": "state", "states": ["WI"], "counties": []},
            "estimate_type": "forest_area",
            "filters": {},
            "grouping": "county",
            "evaluation_year": 2023,
            "live_data": True,
        }
    )
    import pytest
    from app.services.fia_api import FiaApiError

    with pytest.raises(FiaApiError):
        service.build_safe_params(request)
