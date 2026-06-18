from app.models.schemas import EstimateRequest, EstimateResponse
from app.services.estimates import generate_mock_estimate


class FiaApiService:
    """Translation boundary for USDA FIA FIADB-API/EVALIDator calls.

    Production work belongs here so the frontend never sends raw database fields,
    arbitrary SQL, or unverified attribute numbers.
    """

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")

    def build_safe_params(self, request: EstimateRequest) -> dict[str, str]:
        # TODO: Verify current FIADB-API parameter dictionary before enabling
        # production carbon attribute requests. Do not hard-code unverified
        # attribute numbers in application code.
        state = ",".join(request.geography.states)
        counties = ",".join(request.geography.counties)
        return {
            "estimator": "mock-beta",
            "state": state,
            "county": counties,
            "estimate_type": request.estimate_type,
            "grouping": request.grouping or "",
        }

    async def estimate(self, request: EstimateRequest) -> EstimateResponse:
        # Real HTTP call intentionally deferred until official parameter
        # verification and validation fixtures are complete.
        return generate_mock_estimate(request)

