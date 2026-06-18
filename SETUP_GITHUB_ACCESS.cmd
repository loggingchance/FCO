@echo off
setlocal
title FCO - Set Up GitHub Access
cd /d "%~dp0"

echo.
echo ============================================================
echo   FCO - First-Time GitHub Access Setup
echo ============================================================
echo.

where gh >nul 2>nul
if errorlevel 1 (
  echo ERROR: GitHub CLI ^(gh^) is not installed or not on PATH.
  echo Install it from: https://cli.github.com/
  echo.
  pause
  exit /b 1
)

echo This will open GitHub authentication in your browser.
echo Sign in as the account that owns loggingchance/FCO.
echo.

gh auth login --hostname github.com --git-protocol https --web
if errorlevel 1 goto :failed

gh auth setup-git
if errorlevel 1 goto :failed

git config --global --add safe.directory "%CD%"

echo.
echo ============================================================
echo   GitHub access is ready.
echo   You can now double-click UPLOAD_TO_GITHUB.cmd.
echo ============================================================
echo.
pause
exit /b 0

:failed
echo.
echo ERROR: GitHub authentication was not completed.
echo Run this file again and finish the browser sign-in.
echo.
pause
exit /b 1

