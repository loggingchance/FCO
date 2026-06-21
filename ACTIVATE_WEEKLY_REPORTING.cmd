@echo off
setlocal EnableExtensions
title FCO - Activate Weekly Reporting
cd /d "%~dp0"

for /f %%S in ('powershell.exe -NoProfile -Command "[guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')"') do set "CRON_VALUE=%%S"
> "%TEMP%\fco-cron-secret.txt" echo %CRON_VALUE%
type "%TEMP%\fco-cron-secret.txt" | clip
del /q "%TEMP%\fco-cron-secret.txt" >nul 2>nul

echo.
echo ============================================================
echo   FCO - Activate Weekly Usage Email
echo ============================================================
echo.
echo Three browser pages will open for the FCO Vercel project.
echo.
echo 1. On Upstash, click Add Integration / Connect and choose fco-rlga.
echo 2. On Resend, click Add Integration / Connect and choose fco-rlga.
echo 3. In Environment Variables, add:
echo.
echo      Name:  CRON_SECRET
echo      Value: paste the secret already copied to your clipboard
echo.
echo    The secret value is already copied to your clipboard.
echo    Apply it to Production, Preview, and Development.
echo.
echo 4. Redeploy the latest fco-rlga production deployment.
echo.
echo The report recipient is already set to:
echo steve@northeastforests.com
echo.

start "" "https://vercel.com/marketplace/upstash"
start "" "https://vercel.com/marketplace/resend"
start "" "https://vercel.com/loggingchances-projects/fco-rlga/settings/environment-variables"

echo The setup guide is opening as well.
start "" "%~dp0docs\WEEKLY_USAGE_REPORT.md"
echo.
pause
