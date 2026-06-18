# FCO Implementation Status

## Built in this slice

- React + Vite + TypeScript public frontend.
- FastAPI backend with health, geography, options, estimate, report, wizard, model registry, and assumptions endpoints.
- Public pages: Home, Explore Carbon, Compare Places, Reports, Methodology, History, About, Limitations, Data Sources, and Glossary.
- Right-tool decision wizard with guardrail routing.
- Normalized mock estimate response schema.
- CSV, HTML report, and PDF report export flow.
- Impact Workbench shell behind `VITE_ENABLE_WORKBENCH`.
- FIADB-API service boundary with explicit TODO notes for official parameter verification.
- Backend tests for health, estimate schema, and model routing.

## Still intentionally mocked

- FIA/EVALIDator production calls.
- Map boundaries and real GIS layers.
- FVS/FVS-ECON runner.
- IMPLAN/RIMS II imports.
- Fiscal, recreation, stakeholder, and environmental benefit imports.

## Validation run

- Backend tests: passed.
- Frontend TypeScript + production build: passed.
- Same-session live smoke check: backend health returned OK and frontend returned HTTP 200.

