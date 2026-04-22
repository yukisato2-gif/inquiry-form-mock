@echo off
chcp 65001 >nul 2>&1
echo [1] Stopping Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo [2] Cleaning cache...
cd /d "%~dp0"
if exist .next rd /s /q .next >nul 2>&1

echo [3] Starting dev server on port 3000...
start "" cmd /k "cd /d "%~dp0" && npm run dev"

timeout /t 5 /nobreak >nul
echo.
echo ================================
echo   http://localhost:3000
echo ================================
echo.
pause
