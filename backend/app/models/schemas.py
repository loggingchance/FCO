from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


GeographyType = Literal["state", "county", "multi_county", "multi_state"]


class GeographyRequest(BaseModel):
    type: GeographyType
    states: list[str] = Field(default_factory=list)
    counties: list[str] = Field(default_factory=list)


class EstimateRequest(BaseModel):
    geography: GeographyRequest
    estimate_type: str
    filters: dict[str, str] = Field(default_factory=dict)
    grouping: str | None = None
    evaluation_year: int | None = Field(default=None, ge=2000, le=2100)
    live_data: bool = False


class EstimateHeadline(BaseModel):
    label: str
    value: float
    unit: str
    per_acre: float


class EstimateRow(BaseModel):
    label: str
    total: float
    per_acre: float
    area_acres: float
    sampling_error_percent: float | None
    plot_count: int | None = None
    unit: str


class EstimateResponse(BaseModel):
    request: EstimateRequest
    headline: EstimateHeadline
    rows: list[EstimateRow]
    warnings: list[str]
    method_note: str
    data_source: str
    source_mode: Literal["live", "mock", "mock_fallback"] = "mock"
    evaluation_year: int | None = None
    generated_at: datetime = Field(default_factory=datetime.utcnow)

