$ErrorActionPreference = 'Stop'
$raizPacote = Split-Path -Parent $PSScriptRoot
Set-Location $raizPacote

Write-Host '1/6 - Compilando interface React...'
npm.cmd run build

Write-Host '2/6 - Instalando PyInstaller...'
python -m pip install pyinstaller

Write-Host '3/6 - Preparando modelo facial local...'
python tools/preparar-modelo-face.py

Write-Host '4/6 - Gerando motor facial standalone...'
if (Test-Path build\motor-facial) { Remove-Item -LiteralPath build\motor-facial -Recurse -Force }
python -m PyInstaller --noconfirm --clean --onefile --name confrontar-imagens --distpath build\motor-facial --workpath build\pyinstaller-work --specpath build tools\confrontar-imagens.py
Copy-Item -LiteralPath build\modelos -Destination build\motor-facial\modelos -Recurse -Force

Write-Host '5/6 - Gerando aplicativo Electron portátil...'
npx electron-packager . CabineVerde --platform=win32 --arch=x64 --out=build\aplicacao --overwrite --prune=true

Write-Host '6/6 - Incluindo motor facial no aplicativo...'
$appResources = Join-Path $raizPacote 'build\aplicacao\CabineVerde-win32-x64\resources\motor-facial'
New-Item -ItemType Directory -Path $appResources -Force | Out-Null
Copy-Item -LiteralPath build\motor-facial\confrontar-imagens.exe -Destination $appResources -Force
Copy-Item -LiteralPath build\motor-facial\modelos -Destination $appResources\modelos -Recurse -Force
Write-Host "Pacote pronto em: $appResources"
