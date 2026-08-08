create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.member_role as enum ('owner', 'admin', 'member');
create type public.member_status as enum ('active', 'suspended', 'removed');
create type public.invitation_status as enum ('pending', 'accepted', 'cancelled', 'expired');
create type public.transaction_type as enum ('income', 'expense');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  active_household_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.household_members (
  household_id uuid not null references public.households(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null,
  status public.member_status not null default 'active',
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
alter table public.profiles add constraint profiles_active_household_fk
  foreign key (active_household_id) references public.households(id) on delete set null;
create unique index household_single_owner_idx on public.household_members(household_id) where role = 'owner' and status = 'active';
create index household_members_user_idx on public.household_members(user_id) where status = 'active';

create table public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete restrict,
  email_normalized text not null check (email_normalized = lower(trim(email_normalized))),
  role public.member_role not null check (role <> 'owner'),
  token_hash bytea not null unique,
  status public.invitation_status not null default 'pending',
  invited_by uuid not null references auth.users(id) on delete restrict,
  accepted_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index household_pending_invite_idx on public.household_invitations(household_id, email_normalized) where status = 'pending';
create index household_invitations_invited_by_idx on public.household_invitations(invited_by);
create index household_invitations_accepted_by_idx on public.household_invitations(accepted_by);

create table public.accounts (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete restrict,
  name text not null, kind text not null default 'checking', opening_balance_cents bigint not null default 0,
  active boolean not null default true, created_at timestamptz not null default now(), unique(household_id, name)
);
create table public.categories (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete restrict,
  name text not null, type public.transaction_type not null, active boolean not null default true,
  created_at timestamptz not null default now(), unique(household_id, name, type)
);
create table public.transactions (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete restrict,
  account_id uuid not null references public.accounts(id) on delete restrict, category_id uuid references public.categories(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict, type public.transaction_type not null,
  amount_cents bigint not null check (amount_cents > 0), description text not null, notes text,
  transaction_date date not null default current_date, deleted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index accounts_household_idx on public.accounts(household_id);
create index categories_household_idx on public.categories(household_id);
create index transactions_household_date_idx on public.transactions(household_id, transaction_date desc) where deleted_at is null;
create index transactions_account_idx on public.transactions(account_id);
create index transactions_category_idx on public.transactions(category_id);
create index transactions_created_by_idx on public.transactions(created_by);

create table public.audit_events (
  id bigint generated always as identity primary key, household_id uuid references public.households(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null, event_type text not null,
  entity_type text, entity_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index audit_events_household_created_idx on public.audit_events(household_id, created_at desc);

create function private.is_active_member(p_household_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from public.household_members m where m.household_id=p_household_id and m.user_id=auth.uid() and m.status='active');
$$;
create function private.is_household_admin(p_household_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from public.household_members m where m.household_id=p_household_id and m.user_id=auth.uid() and m.status='active' and m.role in ('owner','admin'));
$$;
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,full_name)
  values(new.id,coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),split_part(new.email,'@',1),'Integrante'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();
revoke execute on all functions in schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_active_member(uuid), private.is_household_admin(uuid) to authenticated;

create function public.create_household(p_name text) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_id uuid;
begin
  if v_user is null then raise exception 'Usuario nao autenticado'; end if;
  if nullif(trim(p_name),'') is null then raise exception 'Informe o nome do espaco'; end if;
  insert into public.households(name) values(trim(p_name)) returning id into v_id;
  insert into public.household_members values(v_id,v_user,'owner','active',now());
  update public.profiles set active_household_id=v_id where id=v_user;
  insert into public.accounts(household_id,name) values(v_id,'Conta principal');
  insert into public.categories(household_id,name,type) values
    (v_id,'Salario','income'),(v_id,'Renda extra','income'),(v_id,'Moradia','expense'),
    (v_id,'Alimentacao','expense'),(v_id,'Transporte','expense'),(v_id,'Saude','expense'),(v_id,'Lazer','expense'),(v_id,'Outros','expense');
  insert into public.audit_events(household_id,actor_id,event_type) values(v_id,v_user,'household.created');
  return v_id;
end $$;
create function public.set_active_household(p_household_id uuid) returns uuid language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Usuario nao autenticado'; end if;
  if not private.is_active_member(p_household_id) then raise exception 'Acesso negado'; end if;
  update public.profiles set active_household_id=p_household_id where id=auth.uid(); return p_household_id;
end $$;
create function public.create_invitation(p_household_id uuid,p_email text,p_role public.member_role default 'member')
returns table(invitation_id uuid, token text, expires_at timestamptz) language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_token text:=encode(extensions.gen_random_bytes(32),'hex'); v_exp timestamptz:=now()+interval '7 days'; v_id uuid;
begin
  if v_user is null or not private.is_household_admin(p_household_id) then raise exception 'Acesso negado'; end if;
  if p_role='owner' then raise exception 'Papel invalido'; end if;
  update public.household_invitations i set status='expired' where i.household_id=p_household_id and i.email_normalized=lower(trim(p_email)) and i.status='pending' and i.expires_at<=now();
  insert into public.household_invitations(household_id,email_normalized,role,token_hash,invited_by,expires_at)
  values(p_household_id,lower(trim(p_email)),p_role,extensions.digest(v_token,'sha256'),v_user,v_exp) returning id into v_id;
  return query select v_id,v_token,v_exp;
end $$;
create function public.accept_invitation(p_token text) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_email text:=lower(coalesce(auth.jwt()->>'email','')); v_inv public.household_invitations%rowtype;
begin
  if v_user is null then raise exception 'Usuario nao autenticado'; end if;
  select * into v_inv from public.household_invitations where token_hash=extensions.digest(p_token,'sha256') for update;
  if not found or v_inv.email_normalized<>v_email then raise exception 'Convite invalido para este e-mail'; end if;
  if v_inv.status<>'pending' then raise exception 'Convite indisponivel'; end if;
  if v_inv.expires_at<=now() then update public.household_invitations set status='expired' where id=v_inv.id; return null; end if;
  insert into public.household_members(household_id,user_id,role) values(v_inv.household_id,v_user,v_inv.role)
    on conflict(household_id,user_id) do update set role=excluded.role,status='active';
  update public.household_invitations set status='accepted',accepted_by=v_user,accepted_at=now() where id=v_inv.id;
  update public.profiles set active_household_id=v_inv.household_id where id=v_user;
  insert into public.audit_events(household_id,actor_id,event_type,entity_type,entity_id) values(v_inv.household_id,v_user,'invitation.accepted','invitation',v_inv.id);
  return v_inv.household_id;
end $$;

alter table public.profiles enable row level security; alter table public.households enable row level security;
alter table public.household_members enable row level security; alter table public.household_invitations enable row level security;
alter table public.accounts enable row level security; alter table public.categories enable row level security;
alter table public.transactions enable row level security; alter table public.audit_events enable row level security;
create policy profiles_self_select on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy profiles_self_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy households_member_select on public.households for select to authenticated using(private.is_active_member(id));
create policy members_household_select on public.household_members for select to authenticated using(private.is_active_member(household_id));
create policy invitations_admin_select on public.household_invitations for select to authenticated using(private.is_household_admin(household_id));
create policy accounts_member_all on public.accounts for all to authenticated using(private.is_active_member(household_id)) with check(private.is_active_member(household_id));
create policy categories_member_all on public.categories for all to authenticated using(private.is_active_member(household_id)) with check(private.is_active_member(household_id));
create policy transactions_member_all on public.transactions for all to authenticated using(private.is_active_member(household_id)) with check(private.is_active_member(household_id) and created_by=(select auth.uid()));
create policy audit_admin_select on public.audit_events for select to authenticated using(private.is_household_admin(household_id));

grant select on public.profiles, public.households, public.household_members,
  public.household_invitations, public.audit_events to authenticated;
grant select, insert, update, delete on public.accounts, public.categories,
  public.transactions to authenticated;
revoke update on public.profiles from authenticated; grant update(full_name) on public.profiles to authenticated;
revoke execute on function public.create_household(text),public.set_active_household(uuid),public.create_invitation(uuid,text,public.member_role),public.accept_invitation(text) from public,anon;
grant execute on function public.create_household(text),public.set_active_household(uuid),public.create_invitation(uuid,text,public.member_role),public.accept_invitation(text) to authenticated;
