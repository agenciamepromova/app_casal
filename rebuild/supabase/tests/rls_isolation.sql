begin;
create extension if not exists pgtap with schema extensions;
select plan(35);

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
insert into public.household_invitations(id,household_id,email_normalized,role,token_hash,status,invited_by,expires_at) values
 ('a4444444-4444-4444-4444-444444444444','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','nikson@example.test','member',digest('valid-token','sha256'),'pending','11111111-1111-1111-1111-111111111111',now()+interval '1 day'),
 ('a5555555-5555-5555-5555-555555555555','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','brenda@example.test','member',digest('expired-token','sha256'),'expired','11111111-1111-1111-1111-111111111111',now()-interval '1 day'),
 ('a8888888-8888-8888-8888-888888888888','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','brenda@example.test','member',digest('valid-brenda-token-00000000000000000000','sha256'),'pending','11111111-1111-1111-1111-111111111111',now()+interval '1 day'),
 ('a9999999-9999-9999-9999-999999999999','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','brenda@example.test','member',digest('cancelled-token-00000000000000000000000','sha256'),'cancelled','11111111-1111-1111-1111-111111111111',now()+interval '1 day');
insert into public.financial_commitments(id,household_id,title,type,amount_cents,due_date,account_id,category_id,responsible_id,created_by) values
 ('a6666666-6666-6666-6666-666666666666','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Receber cliente','receivable',25000,current_date,'a1111111-1111-1111-1111-111111111111','a2222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111'),
 ('b6666666-6666-6666-6666-666666666666','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Conta externa','receivable',10000,current_date,'b1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','33333333-3333-3333-3333-333333333333');
insert into public.goals(id,household_id,name,target_cents,created_by) values
 ('a7777777-7777-7777-7777-777777777777','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Reserva',100000,'11111111-1111-1111-1111-111111111111'),
 ('b7777777-7777-7777-7777-777777777777','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Meta externa',100000,'33333333-3333-3333-3333-333333333333');
insert into public.goal_contributions(goal_id,household_id,amount_cents,contributed_by) values
 ('a7777777-7777-7777-7777-777777777777','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',10000,'11111111-1111-1111-1111-111111111111'),
 ('b7777777-7777-7777-7777-777777777777','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',10000,'33333333-3333-3333-3333-333333333333');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","email":"nikson@example.test","role":"authenticated"}',true);
select is((select count(*)::int from public.profiles),1,'Nikson acessa somente o proprio perfil');
select is((select count(*)::int from public.households),1,'Nikson acessa o household do casal');
select is((select count(*)::int from public.accounts),1,'Nikson acessa a conta compartilhada');
select is((select count(*)::int from public.categories),1,'Nikson acessa a categoria compartilhada');
select is((select count(*)::int from public.transactions),1,'Nikson acessa a transacao compartilhada');
select is((select count(*)::int from public.financial_commitments),1,'Nikson acessa os compromissos do casal');
select is((select count(*)::int from public.goals),1,'Nikson acessa as metas do casal');
select is((select count(*)::int from public.goal_contributions),1,'Nikson acessa os aportes do casal');
select is((select count(*)::int from public.households where id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),0,'Nikson nao acessa household externo');

reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-2222-2222-222222222222","email":"brenda@example.test","role":"authenticated"}',true);
select is((select count(*)::int from public.households),1,'Brenda acessa o mesmo household');
select is((select count(*)::int from public.accounts),1,'Brenda visualiza a mesma conta');
select is((select count(*)::int from public.categories),1,'Brenda visualiza a mesma categoria');
select is((select count(*)::int from public.transactions),1,'Brenda visualiza a mesma transacao');
select is((select count(*)::int from public.financial_commitments),1,'Brenda visualiza os mesmos compromissos');
select is((select count(*)::int from public.goals),1,'Brenda visualiza as mesmas metas');
select is((select count(*)::int from public.goal_contributions),1,'Brenda visualiza os mesmos aportes');
select is((select count(*)::int from public.households where id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),0,'Brenda nao acessa household externo');

reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","email":"terceiro@example.test","role":"authenticated"}',true);
select is((select count(*)::int from public.transactions where household_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),0,'Terceiro nao le transacoes do casal');
select is((select count(*)::int from public.financial_commitments where household_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),0,'Terceiro nao le compromissos do casal');
select throws_ok($$insert into public.financial_commitments(household_id,title,type,due_date,responsible_id,created_by) values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Ataque','event',current_date,'33333333-3333-3333-3333-333333333333','33333333-3333-3333-3333-333333333333')$$,'42501',null,'Terceiro nao insere compromissos no household do casal');
select throws_ok($$insert into public.transactions(household_id,account_id,category_id,created_by,type,amount_cents,description) values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','a1111111-1111-1111-1111-111111111111','a2222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','expense',100,'Ataque')$$,'42501',null,'Terceiro nao insere no household do casal');
select results_eq($$update public.transactions set description='Alterada' where id='a3333333-3333-3333-3333-333333333333' returning 1$$,$$select 1 where false$$,'Terceiro nao altera dados do casal');
select results_eq($$delete from public.transactions where id='a3333333-3333-3333-3333-333333333333' returning 1$$,$$select 1 where false$$,'Terceiro nao exclui dados do casal');
select throws_ok($$select public.accept_invitation('valid-token')$$,'P0001','Este convite foi enviado para outro e-mail','Outro e-mail nao aceita o convite');
select throws_ok($$select public.set_active_household('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$$,'P0001','Acesso negado','Usuario nao define household ativo arbitrario');

reset role;
set local role anon;
select is((select invitation_status from public.preview_invitation('valid-brenda-token-00000000000000000000')),'pending','Anon visualiza apenas o resumo de convite válido');
select is((select invitation_status from public.preview_invitation('missing-token-with-enough-characters-000000')),'invalid','Token inexistente retorna estado inválido');
select is(has_table_privilege('anon','public.transactions','select'),false,'Anon não possui acesso às movimentações');
select is((select invitation_status from public.preview_invitation('cancelled-token-00000000000000000000000')),'cancelled','Convite cancelado é identificado');

reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-2222-2222-222222222222","email":"brenda@example.test","role":"authenticated"}',true);
select throws_ok($$select public.accept_invitation('expired-token')$$,'P0001','Convite vencido','Convite expirado nao e aceito');
select is(public.accept_invitation('valid-brenda-token-00000000000000000000'),'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,'Brenda aceita convite válido');
select is((select count(*)::int from public.household_members where household_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and user_id='22222222-2222-2222-2222-222222222222'),1,'Aceite não duplica integrante existente');
select is(public.accept_invitation('valid-brenda-token-00000000000000000000'),'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,'Repetir o aceite é idempotente');
select is((select count(*)::int from public.household_members where household_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and user_id='22222222-2222-2222-2222-222222222222'),1,'Repetição continua sem duplicar integrante');

reset role;
select is((select count(*)::int from information_schema.routine_privileges where routine_schema='public' and grantee in ('anon','PUBLIC') and routine_name in ('create_household','set_active_household','create_invitation','accept_invitation')),0,'RPCs privilegiadas nao sao executaveis por anon ou PUBLIC');

select * from finish();
rollback;
