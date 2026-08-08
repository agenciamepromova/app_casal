begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

select ok((select relrowsecurity from pg_class where oid='public.transactions'::regclass),'RLS ativa em transactions');
select ok((select relrowsecurity from pg_class where oid='public.households'::regclass),'RLS ativa em households');
select is((select count(*)::int from pg_policies where schemaname='public' and tablename='transactions'),1,'transactions possui policy de membership');
select is((select count(*)::int from information_schema.routine_privileges where routine_schema='private' and grantee='anon'),0,'anon nao executa helpers privados');
select is((select count(*)::int from information_schema.routine_privileges where routine_schema='private' and grantee='authenticated'),2,'authenticated executa somente helpers de policy');

select * from finish();
rollback;
