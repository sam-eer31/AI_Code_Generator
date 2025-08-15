@echo off
setlocal

echo Starting Code Generator...

echo Checking prerequisites...

REM Check if MongoDB is running
echo Checking MongoDB...
netstat -an | find "27017" >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] MongoDB is not running on port 27017
    echo Please start MongoDB service or MongoDB Compass
    echo.
    echo To start MongoDB service:
    echo   net start MongoDB
    echo.
    echo Or start MongoDB Compass manually
    echo.
    pause
) else (
    echo [OK] MongoDB is running on port 27017
)

REM Check if Ollama is running
echo Checking Ollama...

REM Check if ollama process is running
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if %errorlevel% equ 0 (
    REM Check if port 11434 is listening
    powershell -Command "try { $null = Get-NetTCPConnection -LocalPort 11434 -State Listen -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Ollama is running on port 11434
        goto :OLLAMA_OK
    )
)

REM If we reach here, Ollama is not running properly
echo [WARNING] Ollama is not running on port 11434
    echo Starting Ollama with administrator privileges...
    echo Please allow administrator access when prompted.
    echo.
    powershell -Command "Start-Process 'ollama' -ArgumentList 'serve' -Verb RunAs -WindowStyle Hidden"
    echo Waiting for Ollama to start...
    
    REM Wait for Ollama to start
    echo Waiting for Ollama to start...
    timeout /t 3 /nobreak >nul
    
    REM Check if Ollama started successfully
    tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
    if %errorlevel% equ 0 (
        timeout /t 2 /nobreak >nul
        powershell -Command "try { $null = Get-NetTCPConnection -LocalPort 11434 -State Listen -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
        if %errorlevel% equ 0 (
            echo [OK] Ollama started successfully on port 11434
            goto :OLLAMA_OK
        )
    )
    
    echo [ERROR] Failed to start Ollama automatically
    echo Please start Ollama manually and run this launcher again.
    pause
    exit /b 1
) else (
    echo [OK] Ollama is running on port 11434
    goto :OLLAMA_OK
)

:OLLAMA_OK

echo.
echo All prerequisites are satisfied!
echo.

echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo Reading port from .env...
for /f "tokens=1,2 delims==" %%a in (.env) do (
  if /I "%%a"=="PORT" set PORT=%%b
)
if "%PORT%"=="" set PORT=8000

echo Starting FastAPI server on port %PORT%...
start cmd /k "uvicorn backend.main:app --reload --port %PORT% --host 127.0.0.1"

echo Waiting for server to start...
timeout /t 3 /nobreak >nul

echo Opening frontend in browser...
start "" "http://127.0.0.1:%PORT%"

echo.
echo Code Generator is starting up!
echo Backend: http://127.0.0.1:%PORT%
echo Frontend: http://127.0.0.1:%PORT%/frontend/
echo.
echo Press any key to exit this launcher...
pause >nul
