from app.data.geographies import COUNTIES, STATES
from app.models.schemas import EstimateHeadline, EstimateRequest, EstimateResponse, EstimateRow


BASE_BY_STATE = {
    "WI": {"area": 17_100_000, "carbon": 1_280_000_000, "se": 4.8},
    "MI": {"area": 20_900_000, "carbon": 1_630_000_000, "se": 4.2},
    "MN": {"area": 15_900_000, "carbon": 1_120_000_000, "se": 5.1},
    "NY": {"area": 18_600_000, "carbon": 1_410_000_000, "se": 4.6},
    "VT": {"area": 4_500_000, "carbon": 355_000_000, "se": 6.3},
    "ME": {"area": 17_600_000, "carbon": 1_360_000_000, "se": 4.4},
}

POOL_SPLIT = [
    ("Live tree", 0.46),
    ("Soil organic", 0.31),
    ("Standing dead", 0.07),
    ("Down dead wood", 0.09),
    ("Litter", 0.07),
]


def _state_label(code: str) -> str:
    return next((item["name"] for item in STATES if item["code"] == code), code)


def _county_label(fips: str) -> str:
    return next((item["name"] for item in COUNTIES if item["fips"] == fips), fips)


def _base_for_request(request: EstimateRequest) -> tuple[str, float, float, float]:
    state = request.geography.states[0] if request.geography.states else "WI"
    base = BASE_BY_STATE.get(state, BASE_BY_STATE["WI"])
    label = _state_label(state)
    area = base["area"]
    carbon = base["carbon"]
    se = base["se"]
    if request.geography.type == "county" and request.geography.counties:
        label = _county_label(request.geography.counties[0])
        area = area * 0.075
        carbon = carbon * 0.073
        se = se + 3.7
    return label, area, carbon, se


def generate_mock_estimate(request: EstimateRequest) -> EstimateResponse:
    label, area, carbon, se = _base_for_request(request)
    unit = "tons CO2e"
    if request.estimate_type == "forest_area":
        headline_value = area
        per_acre = 1
        unit = "acres"
    elif request.estimate_type == "growing_stock_volume":
        headline_value = area * 1_420
        per_acre = 1_420
        unit = "cubic feet"
    else:
        headline_value = carbon
        per_acre = carbon / area

    if request.grouping == "carbon_pool" or request.estimate_type == "carbon_by_pool":
        rows = [
            EstimateRow(
                label=pool,
                total=round(carbon * share, 2),
                per_acre=round((carbon * share) / area, 2),
                area_acres=round(area, 2),
                sampling_error_percent=round(se + idx * 0.7, 1),
                unit="tons CO2e",
            )
            for idx, (pool, share) in enumerate(POOL_SPLIT)
        ]
    elif request.grouping == "ownership_group":
        rows = [
            EstimateRow(label="Public", total=round(headline_value * 0.38, 2), per_acre=round(per_acre * 1.05, 2), area_acres=round(area * 0.36, 2), sampling_error_percent=round(se + 1.8, 1), unit=unit),
            EstimateRow(label="Private", total=round(headline_value * 0.62, 2), per_acre=round(per_acre * 0.97, 2), area_acres=round(area * 0.64, 2), sampling_error_percent=round(se + 1.1, 1), unit=unit),
        ]
    else:
        rows = [EstimateRow(label=label, total=round(headline_value, 2), per_acre=round(per_acre, 2), area_acres=round(area, 2), sampling_error_percent=round(se, 1), unit=unit)]

    warnings = [
        "Beta mock estimate. Real FIA/EVALIDator parameters must be verified before production use.",
        "Do not interpret this broad-area estimate as a parcel, stand, or carbon-offset project estimate.",
    ]
    if request.filters:
        warnings.append("Narrow filters can increase sampling error and may become unstable when plot counts are low.")
    if request.geography.type == "county":
        warnings.append("County estimates should be reviewed for sampling error and plot-count reliability before policy use.")

    return EstimateResponse(
        request=request,
        headline=EstimateHeadline(label=label, value=round(headline_value, 2), unit=unit, per_acre=round(per_acre, 2)),
        rows=rows,
        warnings=warnings,
        method_note="FCO beta returns normalized mock estimates shaped like FIA/EVALIDator outputs. The FIADB-API adapter boundary is present, with production attribute parameters pending official verification.",
        data_source="FCO mock beta data modeled after FIA/EVALIDator response concepts",
    )

