@echo off
setlocal

cd /d "%~dp0"

if not exist ".venv\Scripts\activate" (
  echo ERRO: Ambiente virtual nao encontrado em .venv\Scripts\activate
  pause
  exit /b 1
)

call .venv\Scripts\activate
if errorlevel 1 (
  echo ERRO: Falha ao ativar ambiente virtual.
  pause
  exit /b 1
)

echo [1/3] Validando tasks.json...
python validate_tasks.py --tasks-file tasks.json
if errorlevel 1 (
  echo ERRO: Validacao falhou. Fluxo interrompido.
  pause
  exit /b 1
)

echo [2/3] Simulando publicacao (dry-run)...
python create_plan.py --dry-run --tasks-file tasks.json --prefix "[FemFlow Ops]"
if errorlevel 1 (
  echo ERRO: Dry-run falhou. Fluxo interrompido.
  pause
  exit /b 1
)

set /p CONFIRMAR=DIGITE SIM para aplicar no Google Calendar/Tasks: 
if /I not "%CONFIRMAR%"=="SIM" (
  echo Operacao cancelada pelo usuario.
  pause
  exit /b 0
)

echo [3/3] Aplicando plano no Google...
python create_plan.py --clear-week --tasks-file tasks.json --prefix "[FemFlow Ops]"
if errorlevel 1 (
  echo ERRO: Falha ao aplicar plano no Google.
  pause
  exit /b 1
)

echo Plano aplicado com sucesso.
pause
