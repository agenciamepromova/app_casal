-- =========================================================
-- SPRINT 2: CONVITES E MULTIUSUÁRIOS POR HOUSEHOLD
-- =========================================================

create extension if not exists pgcrypto;

-- 1. Tabela de convites
create table if not exists public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null
    references public.households(id)
    on delete cascade,

  email text not null,
  role text not null default 'member'
    check (role in ('admin', 'member', 'viewer')),

  token uuid not null default gen_random_uuid(),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'cancelled', 'expired')),

  invited_by uuid not null
    references auth.users(id)
    on delete cascade,

  accepted_by uuid
    references auth.users(id)
    on delete set null,

  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),

  constraint household_invitations_token_unique unique (token)
);

-- Evita convites pendentes duplicados para o mesmo e-mail no mesmo espaço
create unique index if not exists household_invitations_pending_unique
on public.household_invitations (
  household_id,
  lower(email)
)
where status = 'pending';

create index if not exists household_invitations_household_idx
on public.household_invitations(household_id);

create index if not exists household_invitations_email_idx
on public.household_invitations(lower(email));

-- 2. Status dos membros
alter table public.household_members
add column if not exists status text not null default 'active'
check (status in ('active', 'removed', 'suspended'));

-- 3. Garante que o mesmo usuário não seja duplicado no mesmo household
create unique index if not exists household_members_unique_member
on public.household_members(household_id, user_id);

-- 4. Ativa RLS
alter table public.household_invitations enable row level security;

-- 5. Remove políticas antigas com esses nomes, caso existam
drop policy if exists "owners_manage_invitations"
on public.household_invitations;

drop policy if exists "members_view_invitations"
on public.household_invitations;

-- 6. Owner pode criar, consultar, cancelar e excluir convites
create policy "owners_manage_invitations"
on public.household_invitations
for all
to authenticated
using (
  exists (
    select 1
    from public.households h
    where h.id = household_invitations.household_id
      and h.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.households h
    where h.id = household_invitations.household_id
      and h.owner_id = (select auth.uid())
  )
  and invited_by = (select auth.uid())
);

-- 7. O usuário convidado pode enxergar o convite ligado ao próprio e-mail
create policy "invitee_can_view_invitation"
on public.household_invitations
for select
to authenticated
using (
  lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
);

-- =========================================================
-- FUNÇÃO: ACEITAR CONVITE
-- =========================================================

create or replace function public.accept_household_invitation(
  p_token uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.household_invitations%rowtype;
  v_user_id uuid;
  v_user_email text;
begin
  v_user_id := auth.uid();
  v_user_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  if v_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select *
  into v_invitation
  from public.household_invitations
  where token = p_token
  for update;

  if not found then
    raise exception 'Convite não encontrado.';
  end if;

  if v_invitation.status <> 'pending' then
    raise exception 'Este convite não está mais disponível.';
  end if;

  if v_invitation.expires_at < now() then
    update public.household_invitations
    set status = 'expired'
    where id = v_invitation.id;

    raise exception 'Este convite expirou.';
  end if;

  if lower(v_invitation.email) <> v_user_email then
    raise exception 'Este convite pertence a outro e-mail.';
  end if;

  insert into public.household_members (
    household_id,
    user_id,
    role,
    status
  )
  values (
    v_invitation.household_id,
    v_user_id,
    v_invitation.role,
    'active'
  )
  on conflict (household_id, user_id)
  do update set
    role = excluded.role,
    status = 'active';

  update public.household_invitations
  set
    status = 'accepted',
    accepted_by = v_user_id,
    accepted_at = now()
  where id = v_invitation.id;

  return v_invitation.household_id;
end;
$$;

grant execute
on function public.accept_household_invitation(uuid)
to authenticated;
