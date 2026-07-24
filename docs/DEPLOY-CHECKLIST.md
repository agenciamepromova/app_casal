# Checklist de deploy

## Supabase

- [x] Executar `database/001_initial_schema.sql`.
- [ ] Confirmar que as tabelas aparecem no Table Editor.
- [ ] Configurar confirmação de e-mail conforme o teste.
- [ ] Copiar Project URL.
- [ ] Copiar apenas a Publishable Key.

## GitHub

- [ ] Enviar `app-web`, `database`, `docs`, `prototype` e `README.md`.
- [ ] Não enviar `.env.local`.
- [ ] Confirmar que `.gitignore` ignora arquivos `.env*`.

## Vercel

- [ ] Root Directory: `app-web`.
- [ ] Framework Preset: Next.js.
- [ ] Adicionar `NEXT_PUBLIC_SUPABASE_URL`.
- [ ] Adicionar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [ ] Fazer novo deploy.
- [ ] Testar cadastro, login e movimentações.
