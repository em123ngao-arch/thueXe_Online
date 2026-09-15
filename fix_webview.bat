@echo off
chcp 65001 >nul
title Sửa lỗi Webview Antigravity IDE
color 0A

echo ========================================================
echo   DANG DON DEP CACHE SERVICE WORKER CHO ANTIGRAVITY IDE
echo ========================================================
echo.

echo 1. Dong cac tien trinh Antigravity va Code con chay ngam...
taskkill /F /IM "Antigravity IDE.exe" /T >nul 2>&1
taskkill /F /IM "Code.exe" /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo 2. Dang xoa thu muc cache Service Worker bi loi...
rmdir /S /Q "%APPDATA%\Antigravity IDE\Service Worker" >nul 2>&1
rmdir /S /Q "%APPDATA%\Code\Service Worker" >nul 2>&1

echo.
echo ========================================================
echo   DA XOA CACHE THANH CONG!
echo   Ban hay mo lai IDE de xem file Markdown binh thuong.
echo ========================================================
echo.
pause
