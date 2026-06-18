# FCO Backend Deployment

## Local Windows backend

Double-click `RUN_FCO_BACKEND.cmd`. It uses `backend/.venv`, installs missing packages, opens the API documentation, and runs FastAPI at `http://127.0.0.1:8000`.

Health check: `http://127.0.0.1:8000/api/health`

## Internet deployment

The repository includes two deployment paths:

- `render.yaml` for a Render Blueprint deployment.
- `backend/Dockerfile` for any container host.

For Render:

1. Upload the latest repository changes to GitHub.
2. In Render, create a new Blueprint and select `loggingchance/FCO`.
3. Render reads `render.yaml` and creates the `fco-api` web service.
4. Set `CORS_ORIGINS` to the deployed frontend origin, such as `https://example.pages.dev`. Multiple origins are comma-separated.
5. After deployment, verify `https://YOUR-BACKEND/api/health` and `https://YOUR-BACKEND/docs`.
6. Set the frontend build variable `VITE_API_BASE_URL` to the backend origin without a trailing slash.

## Required production variables

```text
CORS_ORIGINS=https://your-frontend.example
FIA_API_BASE_URL=https://apps.fs.usda.gov/fiadb-api
FIA_DEFAULT_EVALUATION_YEAR=2023
FIA_TIMEOUT_SECONDS=30
```

