@echo off
setlocal enabledelayedexpansion
title Vibe Brimind Installer

set "INSTALL_DIR=%USERPROFILE%\VibeBrimind"
set "FLAG_FILE=%INSTALL_DIR%\.installed"
set "EXE=%INSTALL_DIR%\Vibe-Brimind.exe"
set "ZIP_URL=https://brimind.pro/storage/Vibe-Brimind-windows.zip"
set "ZIP_FILE=%TEMP%\Vibe-Brimind-windows.zip"

echo.
echo  ============================================
echo   Vibe Brimind - Installer / Launcher
echo  ============================================
echo.

REM --- Already installed? Just run ---
if exist "%FLAG_FILE%" (
  if exist "%EXE%" (
    echo  Already installed. Launching...
    start "" "%EXE%"
    exit /b 0
  )
)

echo  First time setup - this may take a minute...
echo.

REM --- Create install dir ---
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM --- Download zip ---
echo  [1/3] Downloading Vibe Brimind...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%ZIP_URL%' -OutFile '%ZIP_FILE%' -UseBasicParsing"
if %ERRORLEVEL% NEQ 0 (
  echo  ERROR: Download failed. Check your internet connection.
  pause
  exit /b 1
)
echo  Download complete.
echo.

REM --- Extract zip ---
echo  [2/3] Extracting...
powershell -Command "Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%INSTALL_DIR%' -Force"
if %ERRORLEVEL% NEQ 0 (
  echo  ERROR: Extraction failed.
  pause
  exit /b 1
)
del "%ZIP_FILE%" >nul 2>&1
echo  Extraction complete.
echo.

REM --- Write flag ---
echo installed > "%FLAG_FILE%"

REM --- Launch ---
echo  [3/3] Launching Vibe Brimind...
if exist "%EXE%" (
  start "" "%EXE%"
) else (
  REM exe might be inside a subfolder after extraction
  for /r "%INSTALL_DIR%" %%f in (Vibe-Brimind.exe) do (
    start "" "%%f"
    goto :done
  )
  echo  ERROR: Executable not found after extraction.
  pause
  exit /b 1
)

:done
echo  Done! Vibe Brimind is running.
timeout /t 3 /nobreak >nul
exit /b 0
