# Arquitetura

## Aplicação

- Next.js com App Router.
- TypeScript.
- React.
- Supabase para Auth e PostgreSQL.
- Vercel para deploy.
- GitHub como fonte oficial.

## Multi-tenant

O `household` é o workspace/tenant. Dados financeiros possuem `household_id`. A tabela `household_members` relaciona usuários e workspaces.

## Segurança

- Publishable key no cliente.
- Nenhuma secret key no navegador ou GitHub.
- RLS habilitada nas tabelas expostas.
- Políticas verificam participação no household.
- Futuras ações administrativas serão feitas exclusivamente no servidor.

## Convenções

- Banco e código técnico em inglês.
- Interface em português.
- Migrações numeradas em `database/`.
- Funcionalidades entram primeiro no backlog.
- Cada sprint termina com uma versão testável.
