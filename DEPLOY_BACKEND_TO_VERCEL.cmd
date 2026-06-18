@echo off
setlocal
title FCO - Deploy Backend to Vercel
cd /d "%~dp0"

echo.
echo ============================================================
echo   FCO Backend - Vercel Setup
echo ============================================================
echo.
echo 1. Sign in with GitHub.
echo 2. Import loggingchance/FCO.
echo 3. Set Root Directory to: backend
echo 4. Leave Framework Preset as: Other
echo 5. Click Deploy.
echo.
echo After deployment, the health address will be:
echo https://YOUR-PROJECT.vercel.app/api/health
echo.

start "" "https://vercel.com/new"
pause

