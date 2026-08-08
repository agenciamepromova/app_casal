# Arquitetura

## Aplicação

Next.js App Router, TypeScript, React, Supabase Auth/PostgreSQL, Vercel e GitHub.

## Multi-tenant

`households` é o tenant. `household_members` vincula usuários. Todas as entidades financeiras usam `household_id`. O household ativo é persistido em `profiles.active_household_id` e resolvido por `get_active_household()`; é proibido escolher membership arbitrariamente com `limit(1)`.

Roles canônicas: `owner`, `admin`, `member`. Convites só atribuem `admin` ou `member`.

## Convites

Criação, cancelamento e aceite usam RPCs `security definer` com autorização. O aceite bloqueia a linha, valida usuário, e-mail, estado e expiração; cria o membership, marca o convite e persiste o household ativo atomicamente. Um household automático só é removido se for do convidado, não tiver movimentações e não possuir outro membro.

## Segurança

- somente chave publicável no navegador;
- RLS nas tabelas expostas;
- membros ativos acessam somente seu household;
- Owner/Admin gerenciam convites;
- escritas de convite não são feitas diretamente pelo cliente;
- teste negativo com terceiro usuário é obrigatório.

## Convenções

Banco e código em inglês, interface em português, migrations numeradas, mudanças em branch e sprint encerrada somente com versão testável.

