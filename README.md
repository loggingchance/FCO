# FCO - Forest Carbon Online

*The COLE Tribute App*

FCO is an independent, unofficial, COLE-inspired forest carbon explorer. It turns FIA-style forest inventory estimates into understandable maps, tables, charts, and reports for counties, states, and regions.

This repository is the first working build slice from the Codex build specification:

- React + Vite + TypeScript frontend.
- FastAPI backend.
- Mock normalized estimate API.
- Right-tool decision wizard and scale guardrails.
- Public pages for methods, history, limitations, data sources, glossary, and reports.
- Impact Workbench shell behind a feature flag.
- Model registry and assumptions registry endpoints.
- PDF/HTML report generation shell.

## Non-affiliation notice

FCO is an independent, unofficial, COLE-inspired tool. It is not affiliated with, endorsed by, sponsored by, or maintained by the USDA Forest Service, FIA, NCASI, the original COLE development group, or any prior COLE authors. FCO uses public data and public documentation to make FIA-based forest carbon information easier to explore.

Model outputs generated through FCO Impact Workbench depend on user-provided assumptions, external data sources, external model behavior, and project-specific interpretation. FCO does not certify carbon credits, determine regulatory compliance, or replace professional forestry, economics, GIS, legal, or public-policy analysis.

## Quick start

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Environment

Create `frontend/.env.local` if needed:

```text
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_WORKBENCH=true
```

Backend options:

```text
ENABLE_WORKBENCH=true
FIA_API_BASE_URL=https://apps.fs.usda.gov/fiadb-api
FVS_EXECUTABLE_PATH=
```

## Build phases represented here

This build covers the initial repository, public static prototype, mock estimate API, right-tool wizard, backend shell, report shell, and Impact Workbench shell. The FIADB/EVALIDator service includes a safe translation boundary and TODO placeholders where current official parameter dictionaries must be verified before real production estimates are enabled.
