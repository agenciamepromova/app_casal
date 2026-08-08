-- P0 financial operations: settlement state, schedule/recurrence and persisted goals.
-- Additive and data preserving. Existing transactions remain settled.

create type public.transaction_status as enum ('planned', 'pending', 'settled', 'cancelled');
create type public.commitment_type as enum ('payable', 'receivable', 'event');
create type public.commitment_status as enum ('pending', 'completed', 'cancelled');
create type public.recurrence_frequency as enum ('none', 'weekly', 'monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual', 'custom');

alter type public.project_status add value if not exists 'idea' before 'planned';
alter type public.project_status add value if not exists 'cancelled' after 'completed';

alter table public.transactions
  add column status public.transaction_status not null default 'settled',
  add column due_date date,
  add column settled_at date,
  add column source_commitment_id uuid,
  add column source_occurrence_date date;

update public.transactions
set settled_at = transaction_date
where status = 'settled' and settled_at is null;

alter table public.projects
  add column description text,
  add column due_date date,
  add column contracted_cents bigint check (contracted_cents is null or contracted_cents >= 0),
  add column cost_budget_cents bigint check (cost_budget_cents is null or cost_budget_cents >= 0),
  add column responsible_id uuid references auth.users(id) on delete set null,
  add column notes text;

create table public.financial_commitments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text,
  type public.commitment_type not null,
  amount_cents bigint check (amount_cents is null or amount_cents > 0),
  due_date date not null,
  due_time time,
  account_id uuid references public.accounts(id) on delete restrict,
  category_id uuid references public.categories(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  responsible_id uuid not null references auth.users(id) on delete restrict,
  status public.commitment_status not null default 'pending',
  recurrence public.recurrence_frequency not null default 'none',
  custom_interval integer check (custom_interval is null or custom_interval > 0),
  custom_unit text check (custom_unit is null or custom_unit in ('days','weeks','months')),
  recurrence_ends_at date,
  occurrence_limit integer check (occurrence_limit is null or occurrence_limit > 0),
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (recurrence <> 'custom' or (custom_interval is not null and custom_unit is not null)),
  check (recurrence_ends_at is null or recurrence_ends_at >= due_date)
);

alter table public.transactions
  add constraint transactions_source_commitment_fk
  foreign key (source_commitment_id) references public.financial_commitments(id) on delete restrict;

create unique index transactions_commitment_occurrence_idx
  on public.transactions (source_commitment_id, source_occurrence_date)
  where source_commitment_id is not null and deleted_at is null;
create index commitments_household_due_idx
  on public.financial_commitments (household_id, due_date)
  where status = 'pending';
create index commitments_project_idx on public.financial_commitments (project_id);
create index commitments_account_idx on public.financial_commitments (account_id);
create index commitments_category_idx on public.financial_commitments (category_id);
create index commitments_responsible_idx on public.financial_commitments (responsible_id);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 140),
  description text,
  target_cents bigint not null check (target_cents > 0),
  due_date date,
  icon text not null default '✦',
  account_id uuid references public.accounts(id) on delete restrict,
  active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete restrict,
  household_id uuid not null references public.households(id) on delete restrict,
  amount_cents bigint not null check (amount_cents > 0),
  contributed_by uuid not null references auth.users(id) on delete restrict,
  contributed_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create index goals_household_idx on public.goals (household_id) where active;
create index goals_account_idx on public.goals (account_id);
create index goal_contributions_goal_idx on public.goal_contributions (goal_id, contributed_at desc);
create index goal_contributions_household_idx on public.goal_contributions (household_id);
create index goal_contributions_user_idx on public.goal_contributions (contributed_by);

alter table public.financial_commitments enable row level security;
alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;

create policy commitments_member_all on public.financial_commitments
  for all to authenticated
  using (private.is_active_member(household_id))
  with check (private.is_active_member(household_id) and created_by = (select auth.uid()));
create policy goals_member_all on public.goals
  for all to authenticated
  using (private.is_active_member(household_id))
  with check (private.is_active_member(household_id) and created_by = (select auth.uid()));
create policy goal_contributions_member_all on public.goal_contributions
  for all to authenticated
  using (private.is_active_member(household_id))
  with check (private.is_active_member(household_id) and contributed_by = (select auth.uid()));

revoke all on public.financial_commitments, public.goals, public.goal_contributions from anon, authenticated;
grant select, insert, update, delete on public.financial_commitments, public.goals, public.goal_contributions to authenticated;

create function public.settle_financial_commitment(
  p_commitment_id uuid,
  p_occurrence_date date,
  p_amount_cents bigint default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_commitment public.financial_commitments%rowtype;
  v_transaction_id uuid;
  v_type public.transaction_type;
begin
  if v_user is null then raise exception 'Usuário não autenticado'; end if;
  select * into v_commitment
  from public.financial_commitments
  where id = p_commitment_id
  for update;
  if not found or not private.is_active_member(v_commitment.household_id) then
    raise exception 'Compromisso não encontrado';
  end if;
  if v_commitment.type = 'event' then raise exception 'Compromisso sem movimentação financeira'; end if;
  if v_commitment.account_id is null then raise exception 'Selecione uma conta antes de confirmar'; end if;
  if coalesce(p_amount_cents, v_commitment.amount_cents, 0) <= 0 then raise exception 'Informe um valor válido'; end if;
  v_type := case when v_commitment.type = 'receivable' then 'income'::public.transaction_type else 'expense'::public.transaction_type end;

  insert into public.transactions (
    household_id, account_id, category_id, project_id, created_by, type,
    amount_cents, description, notes, transaction_date, status, due_date,
    settled_at, source_commitment_id, source_occurrence_date
  ) values (
    v_commitment.household_id, v_commitment.account_id, v_commitment.category_id,
    v_commitment.project_id, v_user, v_type, coalesce(p_amount_cents, v_commitment.amount_cents),
    v_commitment.title, v_commitment.notes, p_occurrence_date, 'settled',
    p_occurrence_date, current_date, v_commitment.id, p_occurrence_date
  )
  on conflict (source_commitment_id, source_occurrence_date) where source_commitment_id is not null and deleted_at is null
  do update set updated_at = now()
  returning id into v_transaction_id;

  if v_commitment.recurrence = 'none' then
    update public.financial_commitments set status = 'completed', updated_at = now() where id = v_commitment.id;
  end if;
  return v_transaction_id;
end;
$$;

revoke execute on function public.settle_financial_commitment(uuid,date,bigint) from public, anon;
grant execute on function public.settle_financial_commitment(uuid,date,bigint) to authenticated;

-- Qualify the invitation table because the RETURNS TABLE column `expires_at`
-- otherwise conflicts with the table column in PL/pgSQL.
create or replace function public.create_invitation(p_household_id uuid,p_email text,p_role public.member_role default 'member')
returns table(invitation_id uuid,token text,expires_at timestamptz) language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_token text:=encode(extensions.gen_random_bytes(32),'hex'); v_exp timestamptz:=now()+interval '7 days'; v_id uuid; begin
 if v_user is null or not private.is_household_admin(p_household_id) then raise exception 'Acesso negado'; end if;
 if p_role='owner' then raise exception 'Papel inválido'; end if;
 update public.household_invitations as invitation set status='expired'
 where invitation.household_id=p_household_id and invitation.email_normalized=lower(trim(p_email))
   and invitation.status='pending' and invitation.expires_at<=now();
 insert into public.household_invitations(household_id,email_normalized,role,token_hash,invited_by,expires_at)
 values(p_household_id,lower(trim(p_email)),p_role,extensions.digest(v_token,'sha256'),v_user,v_exp) returning id into v_id;
 return query select v_id,v_token,v_exp; end $$;
revoke execute on function public.create_invitation(uuid,text,public.member_role) from public, anon;
grant execute on function public.create_invitation(uuid,text,public.member_role) to authenticated;
