# Checklist de deploy

## Supabase de teste

- [ ] Executar `001_initial_schema.sql`, `002_workspace_invitations.sql` e `003_household_collaboration.sql` na ordem.
- [ ] Confirmar tabelas, funções, constraints e RLS.
- [ ] Configurar confirmação de e-mail conforme o teste.
- [ ] Testar convidado novo e já cadastrado.
- [ ] Testar e-mail diferente, expirado, cancelado e reutilizado.
- [ ] Testar isolamento com terceiro usuário.

## Aplicação

- [x] Build local sem erro com variáveis públicas de build.
- [x] TypeScript sem erro.
- [x] Lint sem erro.
- [ ] Testar entradas, saídas, saldo e histórico após a migration.
- [ ] Testar atualização, logout e novo login sem troca de household.

## Vercel

- [ ] Root Directory `app-web` e variáveis públicas configuradas.
- [ ] Criar preview da branch; não publicar em produção.
- [ ] Repetir o fluxo completo Nikson/Brenda no preview.
- [ ] Registrar URL e evidências.
- [ ] Aprovar produção somente após todos os itens anteriores.
