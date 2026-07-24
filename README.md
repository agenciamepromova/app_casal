# Plano a Dois

SaaS de organização financeira e projetos de vida para casais.

## Estrutura

- `app-web/`: aplicação Next.js.
- `database/`: scripts SQL versionados do Supabase.
- `docs/`: PRD, backlog, roadmap, arquitetura e sprints.
- `prototype/`: referência para a primeira versão estática já publicada.

## Sprint atual

**Sprint 1 — Fundação e Caixa do Casal**

Objetivo: disponibilizar login real, workspace compartilhado, registro de entradas e saídas e dashboard com saldo calculado.

## Execução local

```bash
cd app-web
cp .env.example .env.local
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Variáveis

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Nunca adicione chaves secretas ao repositório.
