# Handoff Codex — colaboração por household

## Diagnóstico encontrado

`002_workspace_invitations.sql` possuía tabela e RPC, mas não UI, rota de aceite ou household ativo. Todo cadastro criava household automático; o dashboard selecionava o primeiro membership sem regra determinística. `viewer` era aceito no convite e rejeitado no membership.

## Implementação da branch

- branch `feat/household-invitations-shared-dashboard`;
- migration `003_household_collaboration.sql`;
- household ativo persistido e resolvido por RPC;
- roles de convite normalizadas;
- criação/cancelamento autorizados;
- aceite idempotente com validação de e-mail e expiração;
- remoção apenas do household automático vazio do convidado;
- `/familia` e `/convite/[token]`;
- token preservado através de login/cadastro;
- dashboard usando household ativo.

## Validação ainda necessária

Aplicar as migrations em Supabase de teste, validar dois usuários e um terceiro externo e verificar preview Vercel. Não aprovar produção antes disso.

