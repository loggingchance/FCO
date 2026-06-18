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
    unit: str


class EstimateResponse(BaseModel):
    request: EstimateRequest
    headline: EstimateHeadline
    rows: list[EstimateRow]
    warnings: list[str]
    method_note: str
    data_source: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class WizardRequest(BaseModel):
    geography: str
    question: str
    timeframe: str
    data: str
    precision: str


class WizardRoute(BaseModel):
    module: str
    warning: str
    next_step: str


class ModelRegistryItem(BaseModel):
    id: str
    name: str
    type: str
    provider: str
    source_url: str
    access_method: str
    valid_geography: list[str]
    best_use: str
    invalid_uses: list[str]
    required_inputs: list[str]
    outputs: list[str]
    units: list[str]
    uncertainty_handling: str
    automation_status: str
    validation_status: str
    notes: str = ""


class Assumption(BaseModel):
    id: str
    project_id: str = "demo"
    category: str
    value: str
    unit: str | None = None
    source: str
    date: str
    analyst: str
    confidence: Literal["low", "medium", "high"]
    notes: str = ""

