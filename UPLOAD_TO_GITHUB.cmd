@echo off
setlocal
title FCO - Upload to GitHub
cd /d "%~dp0"

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\upload-to-github.ps1"
set "RESULT=%ERRORLEVEL%"

echo.
if "%RESULT%"=="0" (
  echo ============================================================
  echo   FCO upload completed successfully.
  echo   https://github.com/loggingchance/FCO
  echo ============================================================
) else (
  echo ============================================================
  echo   FCO upload did not complete. See the message above.
  echo ============================================================
)
echo.
pause
exit /b %RESULT%
