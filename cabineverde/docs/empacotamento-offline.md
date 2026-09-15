# Empacotamento offline

O pacote portátil inclui a aplicação Electron, o motor facial Python convertido em `confrontar-imagens.exe` e o modelo `buffalo_l` dentro de `resources/motor-facial/modelos`.

Na máquina de desenvolvimento, execute no PowerShell:

```powershell
.\tools\build-portable.ps1
```

O resultado será criado em `build\aplicacao\CabineVerde-win32-x64`. Essa pasta pode ser copiada para os dois computadores Windows. O processamento facial usa CPU e não depende de Python instalado no computador de destino.

O banco e a pasta `fotos` permanecem locais. Para transportar dados existentes, copie `data\cabine-verde.sqlite` e `fotos` para a instalação, mantendo backup antes da substituição.
