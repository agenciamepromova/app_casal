# Plano a Dois — Execução do MVP

## Objetivo

Entregar o núcleo financeiro online para Nikson e Brenda: autenticação individual, um household compartilhado, contas, categorias, receitas, despesas, projetos opcionais e temas individuais.

## Fonte técnica

- Projeto Supabase autorizado: `qeuiiixxwfndczjlxkqi`.
- Projeto CRM proibido: `ekwxkqjhxgwucbagvtov`.
- Migrations do MVP: `20260808125831_rebuild_mvp_online.sql` e `20260808133457_mvp_supporting_indexes.sql`.
- Aplicação: `rebuild/` na branch `feat/rebuild-foundation`.

## Estado desta execução

- Schema financeiro substituído por migration versionada.
- Usuários Auth de Nikson e Brenda preservados.
- Household compartilhado recriado sem movimentações fictícias.
- Categorias iniciais e uma conta principal criadas.
- RLS local: 19/19 testes aprovados.
- Lint, TypeScript, build e 3/3 testes unitários aprovados; `npm audit` sem vulnerabilidades.
- Projetos adicionados ao MVP, sem funções de CRM.
- Tema `dark`, `light` e `system` persistido em `profiles.theme`.
- Interface conectada progressivamente ao Supabase quando as variáveis públicas estão configuradas.
- Projeto Vercel isolado: `plano-a-dois-rebuild`; variáveis públicas limitadas a Preview.

## Validação manual pendente

- Entrar com as credenciais reais de Nikson e Brenda.
- Criar receita e despesa com Nikson e confirmar a leitura por Brenda.
- Criar uma movimentação com Brenda e confirmar a leitura por Nikson.
- Repetir após recarga, logout e novo login.
- Confirmar temas individuais e bloqueio de um terceiro usuário no Preview.

## Critério de produção

O Preview deve ser validado com os dois logins reais e um terceiro usuário antes de qualquer merge ou promoção para produção.
