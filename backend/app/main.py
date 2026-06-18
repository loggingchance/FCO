import httpx
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, Response
from app.core.config import get_settings
from app.data.geographies import COUNTIES, ESTIMATE_TYPES, STATES
from app.data.registry import ASSUMPTIONS, MODEL_REGISTRY
from app.models.schemas import Assumption, EstimateRequest, EstimateResponse, ModelRegistryItem, WizardRequest, WizardRoute
from app.services.estimates import generate_mock_estimate
from app.services.fia_api import FiaApiError, FiaApiService
from app.services.reports import estimate_html, estimate_pdf
from app.services.wizard import route_question

settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name, "enable_workbench": settings.enable_workbench}


@app.get("/api/geographies/states")
def states():
    return STATES


@app.get("/api/geographies/counties")
def counties(state: str | None = Query(default=None)):
    if state:
        return [county for county in COUNTIES if county["state"] == state]
    return COUNTIES


@app.get("/api/options/estimate-types")
def estimate_types():
    return ESTIMATE_TYPES


@app.post("/api/estimate", response_model=EstimateResponse)
async def estimate(request: EstimateRequest):
    if request.live_data:
        service = FiaApiService(
            settings.fia_api_base_url,
            default_year=settings.fia_default_evaluation_year,
            timeout=settings.fia_timeout_seconds,
        )
        try:
            return await service.estimate(request)
        except (FiaApiError, httpx.HTTPError) as exc:
            fallback = generate_mock_estimate(request)
            fallback.source_mode = "mock_fallback"
            fallback.warnings.insert(0, f"Live FIADB-API request was unavailable: {exc}")
            return fallback
    return generate_mock_estimate(request)


@app.post("/api/wizard/route", response_model=WizardRoute)
def wizard_route(request: WizardRequest):
    return route_question(request)


@app.post("/api/report")
def report(response: EstimateResponse, format: str = Query(default="html", pattern="^(html|pdf)$")):
    if format == "pdf":
        return Response(content=estimate_pdf(response), media_type="application/pdf")
    return HTMLResponse(content=estimate_html(response))


@app.get("/api/model-registry", response_model=list[ModelRegistryItem])
def model_registry():
    return MODEL_REGISTRY


@app.get("/api/assumptions", response_model=list[Assumption])
def assumptions():
    return ASSUMPTIONS


@app.post("/api/assumptions", response_model=Assumption)
def create_assumption(assumption: Assumption):
    ASSUMPTIONS.append(assumption.model_dump())
    return assumption
