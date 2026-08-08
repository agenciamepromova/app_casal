-- Household ativo deterministico, roles compativeis e convites seguros.
-- Esta migration nao exclui households, membros, contas, categorias ou transacoes.

begin;

alter table public.profiles
  add column if not exists active_household_id uuid
  references public.households(id) on delete set null;

update public.household_invitations
set role = 'member'
where role = 'viewer';

alter table public.household_invitations
  drop constraint if exists household_invitations_role_check;
alter table public.household_invitations
  add constraint household_invitations_role_check
  check (role in ('admin', 'member'));

create index if not exists household_invitations_invited_by_idx
  on public.household_invitations(invited_by);
create index if not exists household_invitations_accepted_by_idx
  on public.household_invitations(accepted_by);
create index if not exists households_owner_id_idx
  on public.households(owner_id);
create index if not exists transactions_account_id_idx
  on public.transactions(account_id);
create index if not exists transactions_category_id_idx
  on public.transactions(category_id);
create index if not exists transactions_created_by_idx
  on public.transactions(created_by);
create index if not exists profiles_active_household_id_idx
  on public.profiles(active_household_id);

create or replace function public.is_household_member(target_household uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household
      and hm.user_id = (select auth.uid())
      and hm.status = 'active'
  );
$$;

create or replace function public.is_household_admin(target_household uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household
      and hm.user_id = (select auth.uid())
      and hm.status = 'active'
      and hm.role in ('owner', 'admin')
  );
$$;

create or replace function public.get_active_household()
returns table(household_id uuid, household_name text, member_role text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_household uuid;
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  select p.active_household_id
  into v_household
  from public.profiles p
  where p.id = v_user;

  if not exists (
    select 1 from public.household_members hm
    where hm.household_id = v_household
      and hm.user_id = v_user
      and hm.status = 'active'
  ) then
    select hm.household_id
    into v_household
    from public.household_members hm
    where hm.user_id = v_user and hm.status = 'active'
    order by (hm.role = 'owner') desc, hm.created_at, hm.household_id
    limit 1;

    update public.profiles
    set active_household_id = v_household
    where id = v_user;
  end if;

  return query
  select h.id, h.name, hm.role
  from public.households h
  join public.household_members hm on hm.household_id = h.id
  where h.id = v_household
    and hm.user_id = v_user
    and hm.status = 'active';
end;
$$;

create or replace function public.set_active_household(p_household_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado.';
  end if;
  if not exists (
    select 1 from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = v_user
      and hm.status = 'active'
  ) then
    raise exception 'Voce nao participa deste household.';
  end if;
  update public.profiles
  set active_household_id = p_household_id
  where id = v_user;
  return p_household_id;
end;
$$;

create or replace function public.create_household_invitation(
  p_household_id uuid, p_email text, p_role text default 'member'
)
returns table(id uuid, token uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_email text := lower(trim(p_email));
begin
  if v_user is null then raise exception 'Usuario nao autenticado.'; end if;
  if not public.is_household_admin(p_household_id) then
    raise exception 'Somente o responsavel ou administrador pode convidar.';
  end if;
  if v_email = '' or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Digite um e-mail valido.';
  end if;
  if p_role not in ('admin', 'member') then raise exception 'Papel invalido.'; end if;
  if exists (
    select 1
    from public.household_members hm
    join auth.users u on u.id = hm.user_id
    where hm.household_id = p_household_id
      and hm.status = 'active'
      and lower(u.email) = v_email
  ) then
    raise exception 'Este e-mail ja pertence ao espaco.';
  end if;

  return query
  insert into public.household_invitations(household_id, email, role, invited_by)
  values (p_household_id, v_email, p_role, v_user)
  returning household_invitations.id, household_invitations.token,
            household_invitations.expires_at;
exception
  when unique_violation then
    raise exception 'Ja existe um convite pendente para este e-mail.';
end;
$$;

create or replace function public.cancel_household_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_household uuid;
begin
  if v_user is null then raise exception 'Usuario nao autenticado.'; end if;
  select i.household_id into v_household
  from public.household_invitations i
  where i.id = p_invitation_id and i.status = 'pending';
  if v_household is null then raise exception 'Convite nao encontrado ou ja utilizado.'; end if;
  if not public.is_household_admin(v_household) then
    raise exception 'Voce nao pode cancelar este convite.';
  end if;
  update public.household_invitations
  set status = 'cancelled'
  where id = p_invitation_id;
end;
$$;

create or replace function public.get_household_invitation(p_token uuid)
returns table(
  invitation_id uuid, household_id uuid, household_name text, email text,
  role text, status text, expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if v_user is null then
    raise exception 'Entre ou crie uma conta para consultar o convite.';
  end if;

  update public.household_invitations i
  set status = 'expired'
  where i.token = p_token
    and lower(i.email) = v_email
    and i.status = 'pending'
    and i.expires_at <= now();

  return query
  select i.id, i.household_id, h.name, i.email, i.role, i.status, i.expires_at
  from public.household_invitations i
  join public.households h on h.id = i.household_id
  where i.token = p_token and lower(i.email) = v_email;
  if not found then
    raise exception 'Convite nao encontrado ou vinculado a outro e-mail.';
  end if;
end;
$$;

create or replace function public.accept_household_invitation(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  i public.household_invitations%rowtype;
  v_user uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if v_user is null then raise exception 'Usuario nao autenticado.'; end if;
  select * into i
  from public.household_invitations
  where token = p_token
  for update;
  if not found then raise exception 'Convite nao encontrado.'; end if;
  if lower(i.email) <> v_email then raise exception 'Este convite pertence a outro e-mail.'; end if;
  if i.status = 'accepted' and i.accepted_by = v_user then
    update public.profiles set active_household_id = i.household_id where id = v_user;
    return i.household_id;
  end if;
  if i.status <> 'pending' then
    raise exception 'Este convite ja foi utilizado, cancelado ou expirou.';
  end if;
  if i.expires_at <= now() then
    update public.household_invitations set status = 'expired' where id = i.id;
    return null;
  end if;

  insert into public.household_members(household_id, user_id, role, status)
  values (i.household_id, v_user, i.role, 'active')
  on conflict (household_id, user_id)
  do update set role = excluded.role, status = 'active';
  update public.household_invitations
  set status = 'accepted', accepted_by = v_user, accepted_at = now()
  where id = i.id;
  update public.profiles
  set active_household_id = i.household_id
  where id = v_user;
  return i.household_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  hid uuid;
begin
  insert into public.profiles(id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  insert into public.households(name, owner_id)
  values (coalesce(new.raw_user_meta_data ->> 'household_name', 'Nosso casal'), new.id)
  returning id into hid;
  insert into public.household_members(household_id, user_id, role)
  values (hid, new.id, 'owner');
  update public.profiles set active_household_id = hid where id = new.id;
  insert into public.accounts(household_id, name, type)
  values (hid, 'Conta principal', 'checking');
  insert into public.categories(household_id, name, type) values
    (hid, 'Salario', 'income'), (hid, 'Renda extra', 'income'), (hid, 'Vendas', 'income'),
    (hid, 'Moradia', 'expense'), (hid, 'Alimentacao', 'expense'), (hid, 'Transporte', 'expense'),
    (hid, 'Saude', 'expense'), (hid, 'Lazer', 'expense'), (hid, 'Outros', 'expense');
  return new;
end;
$$;

-- Preserva um household ativo valido; preenche apenas perfis sem selecao valida.
update public.profiles p
set active_household_id = (
  select hm.household_id
  from public.household_members hm
  where hm.user_id = p.id and hm.status = 'active'
  order by (hm.role = 'owner') desc, hm.created_at, hm.household_id
  limit 1
)
where not exists (
  select 1
  from public.household_members current_hm
  where current_hm.user_id = p.id
    and current_hm.household_id = p.active_household_id
    and current_hm.status = 'active'
);

drop policy if exists "owners_manage_invitations" on public.household_invitations;
drop policy if exists "members_view_invitations" on public.household_invitations;
drop policy if exists "invitee_can_view_invitation" on public.household_invitations;
drop policy if exists "admins_view_invitations" on public.household_invitations;
create policy "admins_view_invitations"
on public.household_invitations for select to authenticated
using (public.is_household_admin(household_id));

drop policy if exists "profiles_household_members" on public.profiles;
create policy "profiles_household_members"
on public.profiles for select to authenticated
using (
  id = (select auth.uid()) or exists (
    select 1 from public.household_members target
    where target.user_id = profiles.id
      and target.status = 'active'
      and public.is_household_member(target.household_id)
  )
);

-- A coluna ativa so pode ser alterada pelas RPCs validadas acima.
revoke update on table public.profiles from authenticated;
grant update(full_name) on table public.profiles to authenticated;

revoke execute on function public.is_household_member(uuid) from public, anon;
revoke execute on function public.is_household_admin(uuid) from public, anon;
revoke execute on function public.get_active_household() from public, anon;
revoke execute on function public.set_active_household(uuid) from public, anon;
revoke execute on function public.create_household_invitation(uuid, text, text) from public, anon;
revoke execute on function public.cancel_household_invitation(uuid) from public, anon;
revoke execute on function public.get_household_invitation(uuid) from public, anon;
revoke execute on function public.accept_household_invitation(uuid) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
do $$
begin
  if to_regprocedure('public.get_household_members(uuid)') is not null then
    execute 'revoke execute on function public.get_household_members(uuid) from public, anon, authenticated';
  end if;
  if to_regprocedure('public.update_household_name(uuid,text)') is not null then
    execute 'revoke execute on function public.update_household_name(uuid, text) from public, anon, authenticated';
  end if;
end;
$$;

grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_admin(uuid) to authenticated;
grant execute on function public.get_active_household() to authenticated;
grant execute on function public.set_active_household(uuid) to authenticated;
grant execute on function public.create_household_invitation(uuid, text, text) to authenticated;
grant execute on function public.cancel_household_invitation(uuid) to authenticated;
grant execute on function public.get_household_invitation(uuid) to authenticated;
grant execute on function public.accept_household_invitation(uuid) to authenticated;

commit;
