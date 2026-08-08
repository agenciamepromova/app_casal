begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

insert into auth.users(id,email,role,aud,raw_app_meta_data,raw_user_meta_data,is_sso_user,is_anonymous,created_at,updated_at) values
 ('11111111-1111-1111-1111-111111111111','nikson@example.test','authenticated','authenticated','{}','{"full_name":"Nikson"}',false,false,now(),now()),
 ('22222222-2222-2222-2222-222222222222','brenda@example.test','authenticated','authenticated','{}','{"full_name":"Brenda"}',false,false,now(),now()),
 ('33333333-3333-3333-3333-333333333333','terceiro@example.test','authenticated','authenticated','{}','{"full_name":"Terceiro"}',false,false,now(),now());
insert into public.households(id,name) values
 ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Casa Nikson e Brenda'),
 ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Casa Externa');
insert into public.household_members(household_id,user_id,role) values
 ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','owner'),
 ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','22222222-2222-2222-2222-222222222222','member'),
 ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','33333333-3333-3333-3333-333333333333','owner');
update public.profiles set active_household_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' where id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222');
update public.profiles set active_household_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' where id='33333333-3333-3333-3333-333333333333';
insert into public.accounts(id,household_id,name) values
 ('a1111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Conta compartilhada'),
 ('b1111111-1111-1111-1111-111111111111','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Conta externa');
insert into public.categories(id,household_id,name,type) values
 ('a2222222-2222-2222-2222-222222222222','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Salario','income'),
 ('b2222222-2222-2222-2222-222222222222','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Salario','income');
insert into public.transactions(id,household_id,account_id,category_id,created_by,type,amount_cents,description) values
 ('a3333333-3333-3333-3333-333333333333','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','a1111111-1111-1111-1111-111111111111','a2222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','income',10000,'Receita do casal'),
 ('b3333333-3333-3333-3333-333333333333','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','b1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','income',5000,'Receita externa');
insert into public.household_invitations(id,household_id,email_normalized,role,token_hash,invited_by,expires_at) values
 ('a4444444-4444-4444-4444-444444444444','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','nikson@example.test','member',digest('valid-token','sha256'),'11111111-1111-1111-1111-111111111111',now()+interval '1 day'),
 ('a5555555-5555-5555-5555-555555555555','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','brenda@example.test','member',digest('expired-token','sha256'),'11111111-1111-1111-1111-111111111111',now()-interval '1 day');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","email":"nikson@example.test","role":"authenticated"}',true);
select is((select count(*)::int from public.profiles),1,'Nikson acessa somente o proprio perfil');
select is((select count(*)::int from public.households),1,'Nikson acessa o household do casal');
select is((select count(*)::int from public.accounts),1,'Nikson acessa a conta compartilhada');
select is((select count(*)::int from public.categories),1,'Nikson acessa a categoria compartilhada');
select is((select count(*)::int from public.transactions),1,'Nikson acessa a transacao compartilhada');
select is((select count(*)::int from public.households where id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),0,'Nikson nao acessa household externo');

reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-2222-2222-222222222222","email":"brenda@example.test","role":"authenticated"}',true);
select is((select count(*)::int from public.households),1,'Brenda acessa o mesmo household');
select is((select count(*)::int from public.accounts),1,'Brenda visualiza a mesma conta');
select is((select count(*)::int from public.categories),1,'Brenda visualiza a mesma categoria');
select is((select count(*)::int from public.transactions),1,'Brenda visualiza a mesma transacao');
select is((select count(*)::int from public.households where id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),0,'Brenda nao acessa household externo');

reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","email":"terceiro@example.test","role":"authenticated"}',true);
select is((select count(*)::int from public.transactions where household_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),0,'Terceiro nao le transacoes do casal');
select throws_ok($$insert into public.transactions(household_id,account_id,category_id,created_by,type,amount_cents,description) values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','a1111111-1111-1111-1111-111111111111','a2222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','expense',100,'Ataque')$$,'42501',null,'Terceiro nao insere no household do casal');
select results_eq($$update public.transactions set description='Alterada' where id='a3333333-3333-3333-3333-333333333333' returning 1$$,$$select 1 where false$$,'Terceiro nao altera dados do casal');
select results_eq($$delete from public.transactions where id='a3333333-3333-3333-3333-333333333333' returning 1$$,$$select 1 where false$$,'Terceiro nao exclui dados do casal');
select throws_ok($$select public.accept_invitation('valid-token')$$,'P0001','Convite invalido para este e-mail','Outro e-mail nao aceita o convite');
select throws_ok($$select public.set_active_household('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$$,'P0001','Acesso negado','Usuario nao define household ativo arbitrario');

reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-2222-2222-222222222222","email":"brenda@example.test","role":"authenticated"}',true);
select is(public.accept_invitation('expired-token'),null::uuid,'Convite expirado nao e aceito');

reset role;
select is((select count(*)::int from information_schema.routine_privileges where routine_schema='public' and grantee in ('anon','PUBLIC') and routine_name in ('create_household','set_active_household','create_invitation','accept_invitation')),0,'RPCs privilegiadas nao sao executaveis por anon ou PUBLIC');

select * from finish();
rollback;
