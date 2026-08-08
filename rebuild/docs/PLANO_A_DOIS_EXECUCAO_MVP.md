# Plano a Dois — Execução do MVP

## Objetivo

Entregar o núcleo financeiro online para Nikson e Brenda: autenticação individual, um household compartilhado, contas, categorias, receitas, despesas, projetos opcionais e temas individuais.

## Fonte técnica

- Projeto Supabase autorizado: `qeuiiixxwfndczjlxkqi`.
- Projeto CRM proibido: `ekwxkqjhxgwucbagvtov`.
- Migrations do MVP: `20260808125831_rebuild_mvp_online.sql`, `20260808133457_mvp_supporting_indexes.sql`, `20260808143544_financial_schedule_and_goals.sql` e `20260808185854_invitation_acceptance_flow.sql`.
- Aplicação: `rebuild/` na branch `feat/rebuild-foundation`.

## Estado desta execução

- Schema financeiro substituído por migration versionada.
- Usuários Auth de Nikson e Brenda preservados.
- Household compartilhado recriado sem movimentações fictícias.
- Categorias iniciais e uma conta principal criadas.
- RLS local: 27/27 testes aprovados, incluindo compromissos e metas.
- Lint PostgreSQL sem erros; lint, TypeScript e build aprovados; 9/9 testes unitários aprovados.
- Projetos adicionados ao MVP, sem funções de CRM.
- Tema `dark`, `light` e `system` persistido em `profiles.theme`.
- Interface conectada progressivamente ao Supabase quando as variáveis públicas estão configuradas.
- Projeto Vercel isolado: `plano-a-dois-rebuild`; variáveis públicas limitadas a Preview.
- Preview técnico: `https://plano-a-dois-rebuild-dlkythr13-nikson-rodrigues-projects.vercel.app` (protegido pela autenticação da Vercel).
- Preview carregado em desktop e celular, com Supabase online e sem overlay de erro.
- O primeiro deploy automático do projeto novo foi removido após a Vercel classificá-lo como Production; o aplicativo histórico não foi substituído.

## Validação manual pendente

- Entrar com as credenciais reais de Nikson e Brenda.
- Criar receita e despesa com Nikson e confirmar a leitura por Brenda.
- Criar uma movimentação com Brenda e confirmar a leitura por Nikson.
- Repetir após recarga, logout e novo login.
- Confirmar temas individuais e bloqueio de um terceiro usuário no Preview.

## Acompanhamento do MVP

| Módulo | Prioridade | Status | Evidência | Data | Commit | Pendência real |
|---|---:|---|---|---|---|---|
| Autenticação e rotas privadas | P0 | concluído | Auth Supabase e proteção no servidor | 2026-08-08 | este commit | Validar sessão expirada com os dois logins reais |
| Persistência financeira | P0 | concluído | Supabase como fonte online; fallback local apenas offline | 2026-08-08 | este commit | Teste manual cruzado Nikson/Brenda |
| Movimentações, contas e categorias | P0 | concluído | CRUD persistente, status e saldo realizado | 2026-08-08 | este commit | Arquivamento de registro em uso exige refinamento |
| Dashboard e previsão | P0 | concluído | Realizado separado de pendente e projetado | 2026-08-08 | este commit | Comparação detalhada com mês anterior |
| Agenda e recorrências | P0 | concluído | Janela calculada sem materialização; liquidação idempotente | 2026-08-08 | este commit | Editar/adiar somente uma ocorrência |
| Projetos e resultado | P1 | concluído | Realizado e projetado separados por projeto | 2026-08-08 | este commit | Tela dedicada de detalhes |
| Metas | P1 | concluído | Metas e aportes persistentes sem duplicar saldo | 2026-08-08 | este commit | Edição e arquivamento na interface |
| Household e temas individuais | P1 | em execução | Mesmo household e `profiles.theme` persistente | 2026-08-08 | este commit | Convite completo e validação manual dos dois usuários |
| Convites e aceite | P0 | concluído | Rota pública, token opaco, retorno após autenticação, e-mail validado e aceite idempotente | 2026-08-08 | este commit | Envio automático depende de `RESEND_API_KEY` e `INVITATION_EMAIL_FROM`; teste final com credenciais reais |
| Importação CSV | P2 | adiado | Fora do caminho crítico | 2026-08-08 | — | Pré-visualização, mapeamento e duplicidades |

## Critério de produção

O Preview deve ser validado com os dois logins reais e um terceiro usuário antes de qualquer merge ou promoção para produção.

## Correção do 404 de convite

A causa foi a ausência da rota `/aceitar-convite`: a tela criava um convite somente no estado local e copiava um UUID fictício, enquanto o proxy classificava a URL inexistente como privada. A correção adiciona a rota dinâmica pública, pré-visualização mínima por token, retorno preservado no login/cadastro, convite persistido, cancelamento real, rotação de link e aceite transacional sem duplicar integrantes. Links pendentes anteriores foram invalidados; não havia convite pendente no banco no momento da aplicação.
