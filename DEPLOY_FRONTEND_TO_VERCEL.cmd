@echo off
setlocal
title FCO - Deploy Frontend to Vercel
cd /d "%~dp0"

echo.
echo ============================================================
echo   FCO Frontend - Vercel Setup
echo ============================================================
echo.
echo 1. Sign in with GitHub.
echo 2. Import loggingchance/FCO as a NEW project.
echo 3. Set Root Directory to: frontend
echo 4. Confirm Framework Preset: Vite
echo 5. Click Deploy.
echo.

start "" "https://vercel.com/new"
pause

