@echo off
setlocal
title FCO - Set Up Vercel Access
cd /d "%~dp0"

echo.
echo ============================================================
echo   FCO - Persistent Vercel Access Setup
echo ============================================================
echo.
echo This installs the Vercel command-line tool for this run and opens
echo the official browser sign-in. Finish the sign-in as loggingchance.
echo.

call npx.cmd --yes vercel@latest login
if errorlevel 1 goto :failed

echo.
echo Vercel access is ready on this computer.
echo.
pause
exit /b 0

:failed
echo.
echo Vercel sign-in was not completed. Check the internet connection
echo and run this file again.
echo.
pause
exit /b 1

