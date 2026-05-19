@echo off
chcp 65001 >nul
title EJ MCAET Library — Desktop Build
cd /d "%~dp0"

echo.
echo  ============================================
echo   EJ MCAET Library — Windows Installer Build
echo  ============================================
echo.
echo  Step 1/3: Books catalog sync...
call node ./scripts/import-books.js
if errorlevel 1 goto :fail

echo.
echo  Step 2/3: Web export (API = Render cloud)...
call npm run export-web
if errorlevel 1 goto :fail

echo.
echo  Step 3/3: Electron installer (.exe)...
call node ./scripts/prepare-desktop-pack.js
if errorlevel 1 goto :fail
set CSC_IDENTITY_AUTO_DISCOVERY=false
call node ./scripts/run-desktop-pack.js
if errorlevel 1 goto :fail

echo.
echo  ============================================
echo   SUCCESS
echo  ============================================
echo.
echo  Installer file:
echo    %cd%\release\EJ MCAET Library Setup *.exe
echo.
echo  Is installer ko kisi bhi Windows PC par copy karke
echo  double-click se install karein — Internet chahiye (API).
echo.
echo  User guide: DESKTOP-USER-HINDI.md
echo.
pause
exit /b 0

:fail
echo.
echo  BUILD FAILED — upar wala error dekhein.
pause
exit /b 1
