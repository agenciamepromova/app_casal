-- PLANO A DOIS - V1
-- Execute todo este arquivo no Supabase > SQL Editor > New query.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (household_id,user_id)
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  type text not null default 'checking' check (type in ('checking','cash','savings','investment','other')),
  opening_balance numeric(14,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(household_id,name,type)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  account_id uuid not null references public.accounts(id),
  category_id uuid references public.categories(id),
  created_by uuid not null references auth.users(id),
  type text not null check (type in ('income','expense')),
  amount numeric(14,2) not null check (amount > 0),
  description text not null,
  notes text,
  transaction_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_members_user on public.household_members(user_id);
create index if not exists idx_transactions_household_date on public.transactions(household_id,transaction_date desc);
create index if not exists idx_accounts_household on public.accounts(household_id);
create index if not exists idx_categories_household on public.categories(household_id);

create or replace function public.is_household_member(target_household uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.household_members hm where hm.household_id=target_household and hm.user_id=(select auth.uid()));
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare new_household_id uuid;
begin
  insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''));
  insert into public.households(name,owner_id) values(coalesce(new.raw_user_meta_data->>'household_name','Nosso casal'),new.id) returning id into new_household_id;
  insert into public.household_members(household_id,user_id,role) values(new_household_id,new.id,'owner');
  insert into public.accounts(household_id,name,type) values(new_household_id,'Conta principal','checking');
  insert into public.categories(household_id,name,type) values
   (new_household_id,'Salário','income'),(new_household_id,'Renda extra','income'),(new_household_id,'Vendas','income'),
   (new_household_id,'Moradia','expense'),(new_household_id,'Alimentação','expense'),(new_household_id,'Transporte','expense'),
   (new_household_id,'Saúde','expense'),(new_household_id,'Lazer','expense'),(new_household_id,'Outros','expense');
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for all to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));

drop policy if exists households_members on public.households;
create policy households_members on public.households for select to authenticated using (public.is_household_member(id));

drop policy if exists members_same_household on public.household_members;
create policy members_same_household on public.household_members for select to authenticated using (user_id=(select auth.uid()) or public.is_household_member(household_id));

drop policy if exists accounts_members on public.accounts;
create policy accounts_members on public.accounts for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

drop policy if exists categories_members on public.categories;
create policy categories_members on public.categories for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

drop policy if exists transactions_members on public.transactions;
create policy transactions_members on public.transactions for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id) and created_by=(select auth.uid()));

grant execute on function public.is_household_member(uuid) to authenticated;
