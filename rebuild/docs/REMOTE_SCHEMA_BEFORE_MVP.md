# Referência recuperável — schema remoto anterior

Capturado antes da migration do MVP em 2026-08-08 no projeto `qeuiiixxwfndczjlxkqi`.

## Conteúdo anterior

- 2 usuários em `auth.users` (preservados).
- 2 profiles, 2 households, 2 memberships e 10 transactions de teste.
- Tabelas: profiles, households, household_members, household_invitations, accounts, categories e transactions.
- Todas as tabelas tinham RLS habilitado, porém `anon` possuía grants amplos em todo o schema público.
- Funções privilegiadas anteriores: `accept_household_invitation`, `get_household_members`, `handle_new_user`, `is_household_member` e `update_household_name`.
- Histórico remoto anterior: `20260729182521_create_crm_mvp_foundation`, `20260729182728_optimize_crm_indexes_and_policies`, `20260729184051_remove_crm_from_finance_project`.

## Recuperação

O código histórico permanece no Git. Os dados financeiros antigos eram exclusivamente de teste e foram autorizados para descarte. Os usuários Auth foram preservados; não existe restauração automática dos registros descartados sem um dump anterior.
