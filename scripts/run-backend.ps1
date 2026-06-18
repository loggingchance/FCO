$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Python = Join-Path $Backend ".venv\Scripts\python.exe"

Set-Location -LiteralPath $Backend

Write-Host ""
Write-Host "============================================================" -ForegroundColor DarkGreen
Write-Host "  FCO Backend" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor DarkGreen
Write-Host ""

if (-not (Test-Path -LiteralPath $Python)) {
    $SystemPython = Get-Command python -ErrorAction SilentlyContinue
    if (-not $SystemPython) {
        throw "Python was not found. Install Python 3.12 or create backend\.venv."
    }
    Write-Host "Creating Python environment..."
    & $SystemPython.Source -m venv .venv
}

& $Python -c "import fastapi, uvicorn, httpx" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing backend packages..."
    & $Python -m pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        throw "Backend package installation failed."
    }
}

Write-Host "Backend URL: http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "API docs:    http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the backend." -ForegroundColor DarkGray
Write-Host ""

Start-Process "http://127.0.0.1:8000/docs"
& $Python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
exit $LASTEXITCODE

