# Visão do Produto — Plano a Dois

Plano a Dois é um SaaS financeiro colaborativo para casais. O casal, não o usuário isolado, é a unidade central. A promessa inicial é um espaço seguro e único para registrar entradas e saídas, acompanhar saldo e decidir em conjunto.

## Marco atual

**Convite → aceite → dois logins → mesmo household → mesmo dashboard.**

Não avançar para Elo, WhatsApp, pagamentos, gamificação, apps nativos ou novos módulos financeiros antes de comprovar esse fluxo e o isolamento entre households.

## Baseline protegido

- cadastro e login;
- dashboard, entradas, saídas, saldo e histórico;
- persistência após atualizar ou entrar novamente;
- RLS por household.

## Regras

- roles: `owner`, `admin`, `member`;
- household ativo persistido em `profiles.active_household_id`;
- Owner/Admin gerenciam convites;
- aceite valida token, estado, expiração e e-mail autenticado;
- dados são compartilhados dentro do household e invisíveis fora dele;
- nada é concluído sem teste comprovável.

