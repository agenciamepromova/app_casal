-- Public invitation preview and authenticated, idempotent acceptance.
-- Previously issued pending links are invalidated because a token was exposed
-- during homologation. No financial or household data is changed.

update public.household_invitations
set status = 'cancelled'
where status = 'pending';

create or replace function public.preview_invitation(p_token text)
returns table(
  invitation_status text,
  inviter_name text,
  household_name text,
  invited_role text,
  invited_email text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation public.household_invitations%rowtype;
begin
  if p_token is null or length(p_token) < 32 then
    return query select 'invalid'::text, null::text, null::text, null::text, null::text, null::timestamptz;
    return;
  end if;

  select invitation.* into v_invitation
  from public.household_invitations as invitation
  where invitation.token_hash = extensions.digest(p_token, 'sha256');

  if not found then
    return query select 'invalid'::text, null::text, null::text, null::text, null::text, null::timestamptz;
    return;
  end if;

  if v_invitation.status = 'pending' and v_invitation.expires_at <= now() then
    update public.household_invitations
    set status = 'expired'
    where id = v_invitation.id and status = 'pending';
    v_invitation.status := 'expired';
  end if;

  return query
  select
    v_invitation.status::text,
    coalesce(nullif(trim(profile.full_name), ''), 'Um integrante')::text,
    household.name::text,
    v_invitation.role::text,
    v_invitation.email_normalized::text,
    v_invitation.expires_at
  from public.households as household
  left join public.profiles as profile on profile.id = v_invitation.invited_by
  where household.id = v_invitation.household_id;
end;
$$;

create or replace function public.rotate_invitation_token(p_invitation_id uuid)
returns table(token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_invitation public.household_invitations%rowtype;
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
  v_expiration timestamptz := now() + interval '7 days';
begin
  if v_user is null then raise exception 'Usuário não autenticado'; end if;

  select invitation.* into v_invitation
  from public.household_invitations as invitation
  where invitation.id = p_invitation_id
  for update;

  if not found or not private.is_household_admin(v_invitation.household_id) then
    raise exception 'Convite não encontrado';
  end if;
  if v_invitation.status <> 'pending' then
    raise exception 'Somente convites pendentes podem gerar um novo link';
  end if;

  update public.household_invitations
  set token_hash = extensions.digest(v_token, 'sha256'), expires_at = v_expiration
  where id = v_invitation.id;

  return query select v_token, v_expiration;
end;
$$;

create or replace function public.cancel_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_household uuid;
begin
  if v_user is null then raise exception 'Usuário não autenticado'; end if;
  select household_id into v_household
  from public.household_invitations
  where id = p_invitation_id;
  if v_household is null or not private.is_household_admin(v_household) then
    raise exception 'Convite não encontrado';
  end if;
  update public.household_invitations
  set status = 'cancelled'
  where id = p_invitation_id and status = 'pending';
end;
$$;

create or replace function public.accept_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt()->>'email', ''));
  v_invitation public.household_invitations%rowtype;
begin
  if v_user is null then raise exception 'Usuário não autenticado'; end if;

  select invitation.* into v_invitation
  from public.household_invitations as invitation
  where invitation.token_hash = extensions.digest(p_token, 'sha256')
  for update;

  if not found then raise exception 'Convite inexistente'; end if;
  if v_invitation.status = 'accepted' and v_invitation.accepted_by = v_user then
    update public.profiles set active_household_id = v_invitation.household_id where id = v_user;
    return v_invitation.household_id;
  end if;
  if v_invitation.status = 'accepted' then raise exception 'Convite já utilizado'; end if;
  if v_invitation.status = 'cancelled' then raise exception 'Convite cancelado'; end if;
  if v_invitation.status = 'expired' then raise exception 'Convite vencido'; end if;
  if v_invitation.expires_at <= now() then
    update public.household_invitations set status = 'expired' where id = v_invitation.id;
    return null;
  end if;
  if v_email = '' or v_email <> v_invitation.email_normalized then
    raise exception 'Este convite foi enviado para outro e-mail';
  end if;

  insert into public.household_members(household_id, user_id, role)
  values(v_invitation.household_id, v_user, v_invitation.role)
  on conflict (household_id, user_id) do nothing;

  update public.household_invitations
  set status = 'accepted', accepted_by = v_user, accepted_at = now()
  where id = v_invitation.id;
  update public.profiles set active_household_id = v_invitation.household_id where id = v_user;
  return v_invitation.household_id;
end;
$$;

revoke execute on function public.preview_invitation(text) from public;
revoke execute on function public.rotate_invitation_token(uuid) from public, anon;
revoke execute on function public.cancel_invitation(uuid) from public, anon;
revoke execute on function public.accept_invitation(text) from public, anon;

grant execute on function public.preview_invitation(text) to anon, authenticated;
grant execute on function public.rotate_invitation_token(uuid) to authenticated;
grant execute on function public.cancel_invitation(uuid) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
