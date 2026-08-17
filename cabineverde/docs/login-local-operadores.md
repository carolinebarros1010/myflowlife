# Login local de operadores

O acesso inicial da Cabine Verde local exige cadastro institucional.

## Regras

- e-mail obrigatorio no dominio `@policiamilitar.sp.gov.br`;
- nome completo obrigatorio;
- RE obrigatorio e aceito somente como digitos numericos;
- Posto/Graduacao obrigatorio;
- equipe obrigatoria;
- operador salvo na tabela `operadores_local` do SQLite;
- apenas operadores ativos podem entrar;
- perfil inicial: `OPERADOR`.

O login local nao consulta Google Sheets/GAS. O cadastro fica no banco oficial local e o ultimo acesso e registrado.
