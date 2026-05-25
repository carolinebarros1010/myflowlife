@echo off
cd /d %~dp0
call .venv\Scripts\activate
python generate_tasks.py --prompt-file pedido.txt --output tasks.json
pause
