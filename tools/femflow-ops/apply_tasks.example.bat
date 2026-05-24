@echo off
setlocal

cd /d "%~dp0"

if not exist ".venv\Scripts\activate.bat" (
  echo .venv nao encontrado. Crie o ambiente virtual antes de aplicar as tarefas.
  pause
  exit /b 1
)

call ".venv\Scripts\activate.bat"
python create_plan.py --tasks-file tasks.json --prefix "[FemFlow Ops]"

pause
