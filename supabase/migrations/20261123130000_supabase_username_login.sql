alter table public.profiles
  add column if not exists username text,
  add column if not exists must_change_password boolean not null default true;

update public.profiles
set username = lower(split_part(email, '@', 1))
where username is null
  and email is not null
  and position('@' in email) > 1;

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  username_value text := lower(split_part(coalesce(new.email, ''), '@', 1));
begin
  if username_value !~ '^[a-z0-9._-]{1,30}$' then
    raise exception using
      errcode = '22023',
      message = 'O nome de usuário da conta é inválido.';
  end if;

  insert into public.profiles (
    id,
    role,
    username,
    must_change_password,
    full_name,
    email,
    avatar_url
  )
  values (
    new.id,
    'student',
    username_value,
    true,
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    new.email,
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  );

  return new;
end;
$$;

create or replace function public.mark_profile_password_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password
    and new.encrypted_password <> '' then
    update public.profiles
    set must_change_password = false
    where id = new.id;
  end if;

  return new;
end;
$$;

revoke all on function public.mark_profile_password_changed() from public, anon, authenticated;

drop trigger if exists on_auth_user_password_changed on auth.users;
create trigger on_auth_user_password_changed
  after update of encrypted_password on auth.users
  for each row execute function public.mark_profile_password_changed();
