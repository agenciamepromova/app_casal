-- Replaces only the historical Plano a Dois test schema. Auth users are preserved.
drop table if exists public.audit_events cascade;
drop table if exists public.transactions cascade;
drop table if exists public.projects cascade;
drop table if exists public.categories cascade;
drop table if exists public.accounts cascade;
drop table if exists public.household_invitations cascade;
drop table if exists public.household_members cascade;
drop table if exists public.households cascade;
drop table if exists public.profiles cascade;
drop function if exists public.accept_household_invitation(uuid) cascade;
drop function if exists public.get_household_members(uuid) cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_household_member(uuid) cascade;
drop function if exists public.update_household_name(uuid,text) cascade;
drop function if exists public.create_household(text) cascade;
drop function if exists public.set_active_household(uuid) cascade;
drop function if exists public.accept_invitation(text) cascade;
drop function if exists public.create_invitation(uuid,text,public.member_role) cascade;
drop function if exists private.is_active_member(uuid) cascade;
drop function if exists private.is_household_admin(uuid) cascade;
drop function if exists private.handle_new_user() cascade;
drop type if exists public.member_role cascade;
drop type if exists public.member_status cascade;
drop type if exists public.invitation_status cascade;
drop type if exists public.transaction_type cascade;
drop type if exists public.project_status cascade;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create type public.member_role as enum ('owner','admin','member');
create type public.member_status as enum ('active','suspended','removed');
create type public.invitation_status as enum ('pending','accepted','cancelled','expired');
create type public.transaction_type as enum ('income','expense');
create type public.project_status as enum ('planned','active','paused','completed');

create table public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null check(char_length(full_name) between 1 and 120),
 active_household_id uuid,
 theme text not null default 'system' check(theme in ('dark','light','system')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.households(
 id uuid primary key default gen_random_uuid(), name text not null check(char_length(name) between 1 and 100),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.household_members(
 household_id uuid not null references public.households(id) on delete restrict,
 user_id uuid not null references auth.users(id) on delete cascade,
 role public.member_role not null, status public.member_status not null default 'active', created_at timestamptz not null default now(),
 primary key(household_id,user_id)
);
alter table public.profiles add constraint profiles_active_household_fk foreign key(active_household_id) references public.households(id) on delete set null;
create unique index household_single_owner_idx on public.household_members(household_id) where role='owner' and status='active';
create index household_members_user_idx on public.household_members(user_id) where status='active';

create table public.household_invitations(
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete restrict,
 email_normalized text not null check(email_normalized=lower(trim(email_normalized))), role public.member_role not null check(role<>'owner'),
 token_hash bytea not null unique, status public.invitation_status not null default 'pending', invited_by uuid not null references auth.users(id) on delete restrict,
 accepted_by uuid references auth.users(id) on delete set null, expires_at timestamptz not null, accepted_at timestamptz, created_at timestamptz not null default now()
);
create unique index household_pending_invite_idx on public.household_invitations(household_id,email_normalized) where status='pending';

create table public.accounts(
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete restrict,
 name text not null, kind text not null default 'checking', opening_balance_cents bigint not null default 0, color text not null default '#d8ab43',
 active boolean not null default true, created_at timestamptz not null default now(), unique(household_id,name)
);
create table public.categories(
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete restrict,
 name text not null, type public.transaction_type not null, icon text not null default '✦', color text not null default '#d8ab43',
 active boolean not null default true, created_at timestamptz not null default now(), unique(household_id,name,type)
);
create table public.projects(
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete restrict,
 name text not null, client_name text, status public.project_status not null default 'planned', expected_revenue_cents bigint check(expected_revenue_cents is null or expected_revenue_cents>=0),
 start_date date, created_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.transactions(
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete restrict,
 account_id uuid not null references public.accounts(id) on delete restrict, category_id uuid references public.categories(id) on delete restrict,
 project_id uuid references public.projects(id) on delete set null, created_by uuid not null references auth.users(id) on delete restrict,
 type public.transaction_type not null, amount_cents bigint not null check(amount_cents>0), description text not null, notes text,
 transaction_date date not null default current_date, recurring boolean not null default false, deleted_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index accounts_household_idx on public.accounts(household_id);
create index categories_household_idx on public.categories(household_id);
create index projects_household_idx on public.projects(household_id);
create index transactions_household_date_idx on public.transactions(household_id,transaction_date desc) where deleted_at is null;
create index transactions_account_idx on public.transactions(account_id);
create index transactions_category_idx on public.transactions(category_id);
create index transactions_project_idx on public.transactions(project_id);
create index transactions_created_by_idx on public.transactions(created_by);

create function private.is_active_member(p_household_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.household_members m where m.household_id=p_household_id and m.user_id=auth.uid() and m.status='active'); $$;
create function private.is_household_admin(p_household_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.household_members m where m.household_id=p_household_id and m.user_id=auth.uid() and m.status='active' and m.role in ('owner','admin')); $$;
create function private.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$ begin
 insert into public.profiles(id,full_name) values(new.id,coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),split_part(new.email,'@',1),'Integrante'));
 return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();
revoke execute on all functions in schema private from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_active_member(uuid),private.is_household_admin(uuid) to authenticated;

create function public.create_household(p_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_id uuid; begin
 if v_user is null then raise exception 'Usuário não autenticado'; end if;
 insert into public.households(name) values(trim(p_name)) returning id into v_id;
 insert into public.household_members(household_id,user_id,role) values(v_id,v_user,'owner');
 update public.profiles set active_household_id=v_id where id=v_user;
 insert into public.accounts(household_id,name,kind) values(v_id,'Conta principal','checking');
 insert into public.categories(household_id,name,type,icon,color) values
 (v_id,'Serviços','income','✦','#69c69b'),(v_id,'Vendas','income','↗','#5ab3d7'),(v_id,'Salário','income','◆','#d8ab43'),(v_id,'Outros','income','+','#9a9e98'),
 (v_id,'Casa','expense','⌂','#a879e8'),(v_id,'Alimentação','expense','◉','#ef8e68'),(v_id,'Transporte','expense','◆','#66a8df'),(v_id,'Saúde','expense','+','#68c6b8'),
 (v_id,'Marketing','expense','↗','#e67ca0'),(v_id,'Ferramentas','expense','⚙','#7d9fe8'),(v_id,'Impostos','expense','%','#d8ab43'),(v_id,'Lazer','expense','♡','#e67ca0'),(v_id,'Outros','expense','…','#9a9e98');
 return v_id; end $$;
create function public.set_active_household(p_household_id uuid) returns uuid language plpgsql security definer set search_path='' as $$ begin
 if not private.is_active_member(p_household_id) then raise exception 'Acesso negado'; end if;
 update public.profiles set active_household_id=p_household_id where id=auth.uid(); return p_household_id; end $$;
create function public.get_household_members(p_household_id uuid) returns table(user_id uuid,full_name text,email text,role public.member_role,status public.member_status)
language sql stable security definer set search_path='' as $$ select m.user_id,p.full_name,u.email,m.role,m.status from public.household_members m join public.profiles p on p.id=m.user_id join auth.users u on u.id=m.user_id where m.household_id=p_household_id and private.is_active_member(p_household_id); $$;
create function public.create_invitation(p_household_id uuid,p_email text,p_role public.member_role default 'member')
returns table(invitation_id uuid,token text,expires_at timestamptz) language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_token text:=encode(extensions.gen_random_bytes(32),'hex'); v_exp timestamptz:=now()+interval '7 days'; v_id uuid; begin
 if v_user is null or not private.is_household_admin(p_household_id) then raise exception 'Acesso negado'; end if;
 if p_role='owner' then raise exception 'Papel inválido'; end if;
 update public.household_invitations set status='expired' where household_id=p_household_id and email_normalized=lower(trim(p_email)) and status='pending' and expires_at<=now();
 insert into public.household_invitations(household_id,email_normalized,role,token_hash,invited_by,expires_at)
 values(p_household_id,lower(trim(p_email)),p_role,extensions.digest(v_token,'sha256'),v_user,v_exp) returning id into v_id;
 return query select v_id,v_token,v_exp; end $$;
create function public.accept_invitation(p_token text) returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_email text:=lower(coalesce(auth.jwt()->>'email','')); v_inv public.household_invitations%rowtype; begin
 if v_user is null then raise exception 'Usuário não autenticado'; end if;
 select * into v_inv from public.household_invitations where token_hash=extensions.digest(p_token,'sha256') for update;
 if not found or v_inv.email_normalized<>v_email then raise exception 'Convite invalido para este e-mail'; end if;
 if v_inv.status<>'pending' then raise exception 'Convite indisponivel'; end if;
 if v_inv.expires_at<=now() then update public.household_invitations set status='expired' where id=v_inv.id; return null; end if;
 insert into public.household_members(household_id,user_id,role) values(v_inv.household_id,v_user,v_inv.role) on conflict(household_id,user_id) do update set role=excluded.role,status='active';
 update public.household_invitations set status='accepted',accepted_by=v_user,accepted_at=now() where id=v_inv.id;
 update public.profiles set active_household_id=v_inv.household_id where id=v_user; return v_inv.household_id; end $$;

alter table public.profiles enable row level security; alter table public.households enable row level security; alter table public.household_members enable row level security;
alter table public.household_invitations enable row level security; alter table public.accounts enable row level security; alter table public.categories enable row level security;
alter table public.projects enable row level security; alter table public.transactions enable row level security;
create policy profiles_self_select on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy profiles_self_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy households_member_select on public.households for select to authenticated using(private.is_active_member(id));
create policy members_household_select on public.household_members for select to authenticated using(private.is_active_member(household_id));
create policy invitations_admin_all on public.household_invitations for all to authenticated using(private.is_household_admin(household_id)) with check(private.is_household_admin(household_id) and invited_by=(select auth.uid()));
create policy accounts_member_all on public.accounts for all to authenticated using(private.is_active_member(household_id)) with check(private.is_active_member(household_id));
create policy categories_member_all on public.categories for all to authenticated using(private.is_active_member(household_id)) with check(private.is_active_member(household_id));
create policy projects_member_all on public.projects for all to authenticated using(private.is_active_member(household_id)) with check(private.is_active_member(household_id) and created_by=(select auth.uid()));
create policy transactions_member_all on public.transactions for all to authenticated using(private.is_active_member(household_id)) with check(private.is_active_member(household_id) and created_by=(select auth.uid()));

revoke all on all tables in schema public from anon,authenticated;
grant select on public.profiles,public.households,public.household_members,public.household_invitations to authenticated;
grant select,insert,update,delete on public.accounts,public.categories,public.projects,public.transactions to authenticated;
grant update(full_name,theme) on public.profiles to authenticated;
revoke execute on all functions in schema public from public,anon;
grant execute on function public.create_household(text),public.set_active_household(uuid),public.get_household_members(uuid),public.create_invitation(uuid,text,public.member_role),public.accept_invitation(text) to authenticated;

insert into public.profiles(id,full_name)
select id,coalesce(nullif(trim(raw_user_meta_data->>'full_name'),''),split_part(email,'@',1)) from auth.users on conflict(id) do nothing;

do $$ declare v_household uuid; v_nikson uuid; v_brenda uuid; begin
 select id into v_nikson from auth.users where lower(email)='agenciamepromova@gmail.com';
 select id into v_brenda from auth.users where lower(email)='bs386502@gmail.com';
 if v_nikson is not null and v_brenda is not null then
  insert into public.households(name) values('Nikson & Brenda') returning id into v_household;
  insert into public.household_members(household_id,user_id,role) values(v_household,v_nikson,'owner'),(v_household,v_brenda,'member');
  update public.profiles set active_household_id=v_household where id in(v_nikson,v_brenda);
  insert into public.accounts(household_id,name,kind,color) values(v_household,'Conta principal','checking','#d8ab43');
  insert into public.categories(household_id,name,type,icon,color) values
  (v_household,'Serviços','income','✦','#69c69b'),(v_household,'Vendas','income','↗','#5ab3d7'),(v_household,'Salário','income','◆','#d8ab43'),(v_household,'Outros','income','+','#9a9e98'),
  (v_household,'Casa','expense','⌂','#a879e8'),(v_household,'Alimentação','expense','◉','#ef8e68'),(v_household,'Transporte','expense','◆','#66a8df'),(v_household,'Saúde','expense','+','#68c6b8'),
  (v_household,'Marketing','expense','↗','#e67ca0'),(v_household,'Ferramentas','expense','⚙','#7d9fe8'),(v_household,'Impostos','expense','%','#d8ab43'),(v_household,'Lazer','expense','♡','#e67ca0'),(v_household,'Outros','expense','…','#9a9e98');
 end if; end $$;
