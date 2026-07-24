@echo off
setlocal
cd /d "%~dp0"

set "SCBT_PORT=4173"
set "SCBT_URL=http://127.0.0.1:%SCBT_PORT%/exam.html?module=speaking&started=0"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$existing = Get-NetTCPConnection -State Listen -LocalPort %SCBT_PORT% -ErrorAction SilentlyContinue; if (-not $existing) { Start-Process -FilePath 'python' -ArgumentList @('-m','http.server','%SCBT_PORT%','--bind','127.0.0.1') -WorkingDirectory '%~dp0' -WindowStyle Hidden }"

timeout /t 1 /nobreak >nul
start "" "%SCBT_URL%"
endlocal
