from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

from app.data.geographies import STATES
from app.models.schemas import (
    EstimateHeadline,
    EstimateRequest,
    EstimateResponse,
    EstimateRow,
)


STATE_FIPS = {
    "ME": 23,
    "MI": 26,
    "MN": 27,
    "NY": 36,
    "VT": 50,
    "WI": 55,
}


@dataclass(frozen=True)
class EstimateDefinition:
    snum: int
    label: str
    unit: str


# These mappings are corroborated by the current FIADB-API parameter catalog,
# pyFIA's EVALIDator validation client, and USDA FIESTA validation examples.
ESTIMATE_DEFINITIONS = {
    "forest_area": EstimateDefinition(2, "Forest area", "acres"),
    "total_carbon": EstimateDefinition(97, "Total forest carbon", "metric tonnes carbon"),
}


class FiaApiError(RuntimeError):
    pass


def _state_name(code: str) -> str:
    return next((item["name"] for item in STATES if item["code"] == code), code)


def _number(record: dict[str, Any], key: str, default: float = 0) -> float:
    value = record.get(key, default)
    if value in (None, "", "--"):
        return default
    return float(value)


class FiaApiService:
    """Safe adapter for official USDA Forest Service FIADB-API estimates."""

    def __init__(
        self,
        base_url: str,
        default_year: int = 2023,
        timeout: float = 30,
        http_client: httpx.AsyncClient | None = None,
    ):
        self.base_url = base_url.rstrip("/")
        self.default_year = default_year
        self.timeout = timeout
        self.http_client = http_client

    def build_safe_params(self, request: EstimateRequest) -> dict[str, str | int]:
        if request.geography.type != "state" or len(request.geography.states) != 1:
            raise FiaApiError("The first live-data release supports one state at a time.")
        if request.filters:
            raise FiaApiError("Live advanced filters are not enabled until each filter mapping is validated.")
        if request.grouping not in (None, "state"):
            raise FiaApiError("The first live-data release supports ungrouped state totals only.")

        state = request.geography.states[0]
        state_fips = STATE_FIPS.get(state)
        definition = ESTIMATE_DEFINITIONS.get(request.estimate_type)
        if state_fips is None:
            raise FiaApiError(f"No validated FIA state mapping is configured for {state}.")
        if definition is None:
            raise FiaApiError(f"{request.estimate_type} is not enabled for live FIA queries yet.")

        year = request.evaluation_year or self.default_year
        return {
            "snum": definition.snum,
            "wc": int(f"{state_fips}{year}"),
            "rselected": "Total",
            "cselected": "Total",
            "outputFormat": "NJSON",
        }

    async def _post(self, params: dict[str, str | int]) -> dict[str, Any]:
        endpoint = f"{self.base_url}/fullreport"
        if self.http_client is not None:
            response = await self.http_client.post(endpoint, data=params)
        else:
            async with httpx.AsyncClient(
                timeout=self.timeout,
                headers={"User-Agent": "FCO/0.1 FIADB validation client"},
            ) as client:
                response = await client.post(endpoint, data=params)

        response.raise_for_status()
        content_type = response.headers.get("content-type", "")
        if "html" in content_type.lower():
            raise FiaApiError("FIADB-API returned an HTML error page instead of estimate data.")
        try:
            payload = response.json()
        except ValueError as exc:
            raise FiaApiError("FIADB-API returned invalid JSON.") from exc
        if payload.get("error"):
            raise FiaApiError(f"FIADB-API error: {payload['error']}")
        return payload

    async def _fetch_record(self, request: EstimateRequest) -> dict[str, Any]:
        payload = await self._post(self.build_safe_params(request))
        estimates = payload.get("estimates") or []
        if not estimates:
            raise FiaApiError("FIADB-API returned no estimates for this evaluation year.")
        return estimates[0]

    async def estimate(self, request: EstimateRequest) -> EstimateResponse:
        definition = ESTIMATE_DEFINITIONS[request.estimate_type]
        state = request.geography.states[0]
        year = request.evaluation_year or self.default_year
        record = await self._fetch_record(request)

        value = _number(record, "ESTIMATE")
        sampling_error_pct = _number(record, "SE_PERCENT")
        plot_count = int(_number(record, "PLOT_COUNT"))

        if request.estimate_type == "forest_area":
            area = value
            per_acre = 1.0
        else:
            area_request = request.model_copy(update={"estimate_type": "forest_area"})
            area_record = await self._fetch_record(area_request)
            area = _number(area_record, "ESTIMATE")
            per_acre = value / area if area else 0

        warnings = [
            "Official broad-area FIA/EVALIDator estimate; do not use it as a parcel, stand, or offset-project estimate."
        ]
        if sampling_error_pct >= 20:
            warnings.append("Sampling error is 20% or greater; interpret this estimate cautiously.")
        if plot_count and plot_count < 30:
            warnings.append("Fewer than 30 plots contribute to this estimate; reliability may be limited.")

        label = _state_name(state)
        row = EstimateRow(
            label=label,
            total=round(value, 2),
            per_acre=round(per_acre, 4),
            area_acres=round(area, 2),
            sampling_error_percent=round(sampling_error_pct, 2),
            plot_count=plot_count,
            unit=definition.unit,
        )
        return EstimateResponse(
            request=request,
            headline=EstimateHeadline(
                label=definition.label,
                value=row.total,
                unit=definition.unit,
                per_acre=row.per_acre,
            ),
            rows=[row],
            warnings=warnings,
            method_note=(
                f"Official FIADB-API fullreport estimate using attribute {definition.snum}, "
                f"evaluation group {STATE_FIPS[state]}{year}, with FIA sampling error and plot count."
            ),
            data_source="USDA Forest Service FIA FIADB-API / EVALIDator",
            source_mode="live",
            evaluation_year=year,
        )
