@echo off
REM start.bat — Khoi dong bridge server va mo index.html trong trình duyet

echo [start] Dang don dep cac tien trinh cu...
taskkill /f /im python.exe /fi "WINDOWTITLE eq bridge.py*" 2>nul || (
    REM Fallback don gian
    taskkill /f /im python.exe /fi "IMAGENAME eq python.exe" /fi "CPUTIME gt 00:00:00" 2>nul || echo.
)

echo [start] Dang khoi dong bridge.py tren cong 7700...
start "bridge.py" /min python bridge.py

timeout /t 1 /nobreak >nul

echo [start] Dang mo giao dien nguoi dung...
set "BRIDGE_PARAM=?bridge=127.0.0.1:7700"
set "TARGET_URL=%~dp0index.html%BRIDGE_PARAM%"

start "" "%TARGET_URL%"

echo [start] Bridge dang chay ngầm.
echo [start] Bam Ctrl+C tai cua so bridge (neu co) de dung.
pause
