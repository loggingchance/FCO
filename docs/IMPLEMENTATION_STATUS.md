# FCO Implementation Status

## Built in this slice

- React + Vite + TypeScript public frontend.
- FastAPI backend with health, geography, estimate options, estimate, and report endpoints.
- Public pages: Home, Explore Carbon, Compare Places, Reports, Methodology, History, About, Limitations, Data Sources, and Glossary.
- Normalized mock estimate response schema.
- CSV, HTML report, and PDF report export flow.
- FIADB-API service boundary with validated initial attribute mappings.
- Live FIADB-API state-total adapter for forest area and total forest carbon.
- User-selectable FIA evaluation year and visible live/fallback/mock status.
- FIA sampling error and plot count normalization with reliability warnings.
- Backend tests for health, estimate schema, FIADB normalization, and grouping guardrails.

## Live-data boundary

- Official endpoint: `POST https://apps.fs.usda.gov/fiadb-api/fullreport`.
- Enabled mappings: forest area (`snum=2`) and total forest carbon (`snum=97`).
- Enabled geography/grouping: one state, ungrouped state total.
- Response format: `NJSON`, normalized from `ESTIMATE`, `SE_PERCENT`, and `PLOT_COUNT`.
- Invalid evaluation years, unsupported groupings, filters, counties, or network failures return a visibly labeled mock fallback.

## Still intentionally mocked

- County and multi-state FIA/EVALIDator calls.
- FIA grouping and advanced filter mappings.
- Map boundaries and real GIS layers.
- Production maps and saved report permalinks.

## Validation run

- Backend tests cover API health, estimate schema, official-response normalization, and grouping guardrails.
- Frontend TypeScript + production build: passed.
- Same-session live smoke check: backend health returned OK and frontend returned HTTP 200.
