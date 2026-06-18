# FCO Backend Deployment

## Local Windows backend

Double-click `RUN_FCO_BACKEND.cmd`. It uses `backend/.venv`, installs missing packages, opens the API documentation, and runs FastAPI at `http://127.0.0.1:8000`.

Health check: `http://127.0.0.1:8000/api/health`

## Internet deployment with Vercel

The backend follows Vercel's standard FastAPI layout. `backend/main.py` exports the FastAPI `app`, and `backend/pyproject.toml` declares the Python runtime dependencies.

1. Upload the latest repository changes to GitHub.
2. Double-click `DEPLOY_BACKEND_TO_VERCEL.cmd`, or open Vercel and create a new project.
3. Sign in with GitHub and import `loggingchance/FCO`.
4. Set **Root Directory** to `backend`.
5. Leave **Framework Preset** as `Other` and deploy.
6. Verify `https://YOUR-PROJECT.vercel.app/api/health` and `https://YOUR-PROJECT.vercel.app/docs`.
7. The public read-only API permits browser requests from any origin by default. Set `CORS_ORIGINS` only if a later deployment requires a restricted origin list.
8. Set the frontend project's `VITE_API_BASE_URL` to the backend origin without a trailing slash.

## Required production variables

```text
CORS_ORIGINS=*
FIA_API_BASE_URL=https://apps.fs.usda.gov/fiadb-api
FIA_DEFAULT_EVALUATION_YEAR=2023
FIA_TIMEOUT_SECONDS=30
```
