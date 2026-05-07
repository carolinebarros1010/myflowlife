# Splash Screen — Cabine Verde Esperança (2026-05-07)

## Objetivo
Implementar uma tela de abertura premium para reforçar acolhimento, esperança, confiança e calma emocional antes da renderização do fluxo operacional principal.

## Alterações aplicadas

### 1) Estrutura HTML (`public/index.html`)
- Inclusão do contêiner `#cv-splash` ocupando 100% da viewport.
- Logo central com marca textual, título "Cabine Verde" e subtítulo "Esperança".
- Loading discreto inferior com três pontos animados.
- `#app` inicializado com `is-hidden` até o fim da transição da splash.

### 2) Estilo visual (`public/styles/main.css`)
- Fundo em degradê com paleta operacional:
  - `#0B3D2E`
  - `#1F6F50`
  - `#8FD9A8`
  - Branco suave
- Glow suave com elementos radiais.
- Animações:
  - `cvFadeIn` para entrada do conteúdo textual.
  - `cvPulse` para respiração/pulsação do logo.
  - `cvDot` para indicador de loading.
- Saída suave da splash com `opacity` + `visibility`.

### 3) Comportamento JavaScript (`public/js/app.js`)
- Novo fluxo `iniciarSplashScreen()` executado na carga do módulo.
- Transição automática para a tela principal em ~2.8s (ou ~0.9s quando `prefers-reduced-motion` está ativo).
- Remoção do nó da splash após fade-out para liberar o DOM.
- Atualização de acessibilidade:
  - `#app` deixa `aria-hidden="true"` para `false` quando exibido.

## Impacto operacional
- Mantém fluxo de triagem intacto e sem alterar regras de negócio.
- Introduz percepção de aplicação mobile/PWA premium sem afetar mapeamentos de payload e integrações.
