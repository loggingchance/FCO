@echo off
setlocal
title FCO Backend
cd /d "%~dp0"

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run-backend.ps1"
set "RESULT=%ERRORLEVEL%"

echo.
if not "%RESULT%"=="0" echo FCO backend stopped with an error.
pause
exit /b %RESULT%

