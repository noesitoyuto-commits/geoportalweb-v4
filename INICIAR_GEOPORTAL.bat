@echo off
setlocal
cd /d "%~dp0"
if exist "venv\Scripts\python.exe" (
    set "AMPAY_PYTHON=venv\Scripts\python.exe"
) else (
    set "AMPAY_PYTHON=python"
    where python >nul 2>&1
    if errorlevel 1 set "AMPAY_PYTHON=py"
)
"%AMPAY_PYTHON%" -c "import sys; sys.exit(0)" >nul 2>&1
if errorlevel 1 (
    echo Instala Python o abre index.html para consultar los mapas y datos locales.
    pause
    exit /b 1
)
"%AMPAY_PYTHON%" -c "from importlib.metadata import version; import PIL; assert tuple(map(int, version('flask').split('.')[:2])) >= (3, 1)" >nul 2>&1
if errorlevel 1 (
    "%AMPAY_PYTHON%" -m pip install "Flask>=3.1" "Pillow>=10.4"
    if errorlevel 1 (
        echo Abre index.html para consultar los mapas y datos locales.
        pause
        exit /b 1
    )
)
"%AMPAY_PYTHON%" server\app.py --open
if errorlevel 1 pause
