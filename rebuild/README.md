# Plano a Dois — reconstrução

Nova base técnica mantida separada do aplicativo atual.

## Local

1. Copie `.env.example` para `.env.local` e use apenas credenciais do Supabase local.
2. Execute `npx supabase start`.
3. Execute `npx supabase db reset`.
4. Execute `npm run dev`.

## Verificações

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npx supabase test db`

Nenhum comando deste diretório deve ser vinculado a um projeto remoto durante a Fase 1.
