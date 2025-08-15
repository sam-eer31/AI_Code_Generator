@echo off
setlocal enabledelayedexpansion

echo Setting up Code Generator environment...

if not exist .venv (
  echo Creating virtual environment...
  py -3 -m venv .venv
)

echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo Upgrading pip...
python -m pip install --upgrade pip

echo Installing dependencies...
pip install -r requirements.txt

if not exist .env (
  echo Creating .env file with default settings...
  echo MONGODB_URI=mongodb://localhost:27017>.env
  echo OLLAMA_HOST=http://localhost:11434>>.env
  echo MODEL_NAME=qwen2.5:14b>>.env
  echo PORT=8000>>.env
  echo Database name added to .env
)

echo.
echo Installation complete! 
echo Make sure MongoDB is running on localhost:27017
echo Make sure Ollama is running with qwen2.5:14b model
echo Run launcher.bat to start the application
pause
