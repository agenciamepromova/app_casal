# Plano a Dois — V1

V1 funcional do SaaS financeiro para casais.

## O que já funciona
- Cadastro e login reais com Supabase Auth
- Criação automática do espaço do casal
- Conta e categorias iniciais
- Registro de entradas e saídas
- Dashboard com saldo, entradas e saídas
- Histórico e exclusão de movimentações
- Segurança por Row Level Security (RLS)
- Layout responsivo

## Configuração
1. No Supabase, abra **SQL Editor**, cole e execute `supabase/schema.sql`.
2. Em **Authentication > Providers > Email**, mantenha Email habilitado.
3. Para testar imediatamente, você pode desativar temporariamente **Confirm email**. Para produção, reative.
4. Copie `.env.example` para `.env.local` e preencha URL e Publishable Key.
5. Execute:
   ```bash
   npm install
   npm run dev
   ```
6. Abra `http://localhost:3000`, crie a primeira conta e registre movimentações.

## Deploy na Vercel
- Importe este projeto/repositório.
- Adicione as variáveis:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Faça o deploy.

## Segurança
Nunca use a Secret Key ou service_role no navegador. A V1 usa somente a Publishable Key e protege os dados com RLS.
