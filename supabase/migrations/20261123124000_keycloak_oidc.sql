drop policy if exists "Profiles can be read by their owner" on public.profiles;
drop policy if exists "Profiles can be updated by their owner" on public.profiles;
drop policy if exists "Parents can read their own student links" on public.parent_student_links;
drop policy if exists "Students can read their own parent links" on public.parent_student_links;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

alter table public.parent_student_links
  drop constraint if exists parent_student_links_parent_id_fkey;
alter table public.parent_student_links
  drop constraint if exists parent_student_links_student_id_fkey;
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.profiles
  alter column id type text using id::text;
alter table public.parent_student_links
  alter column parent_id type text using parent_id::text,
  alter column student_id type text using student_id::text;

alter table public.parent_student_links
  add constraint parent_student_links_parent_id_fkey
    foreign key (parent_id) references public.profiles (id) on delete cascade,
  add constraint parent_student_links_student_id_fkey
    foreign key (student_id) references public.profiles (id) on delete cascade;

create type public.app_role_v2 as enum ('student', 'parent', 'tutor');
alter table public.profiles
  alter column role type public.app_role_v2 using role::text::public.app_role_v2;
drop type public.app_role;
alter type public.app_role_v2 rename to app_role;

alter table public.profiles
  add column username text;

create unique index profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null;

create table public.trusted_auth_issuers (
  issuer text primary key,
  created_at timestamptz not null default now()
);

alter table public.trusted_auth_issuers enable row level security;
revoke all on table public.trusted_auth_issuers from public, anon, authenticated;

create or replace function public.is_trusted_keycloak_token()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.trusted_auth_issuers as trusted
    where trusted.issuer = (select auth.jwt() ->> 'iss')
  );
$$;

revoke all on function public.is_trusted_keycloak_token() from public, anon;
grant execute on function public.is_trusted_keycloak_token() to authenticated;

create or replace function public.ensure_keycloak_profile()
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  claims jsonb := auth.jwt();
  role_claims jsonb;
  external_id text;
  username_value text;
  role_count integer;
  profile_role public.app_role;
  result public.profiles;
begin
  if not public.is_trusted_keycloak_token() then
    raise exception using
      errcode = '42501',
      message = 'O emissor da sessão não está autorizado.';
  end if;

  external_id := claims ->> 'sub';
  username_value := lower(btrim(claims ->> 'preferred_username'));
  role_claims := claims -> 'realm_access' -> 'roles';

  if external_id is null or external_id = '' then
    raise exception using errcode = '22023', message = 'O token não contém um identificador.';
  end if;

  if username_value is null or username_value !~ '^[a-z0-9._-]{1,30}$' then
    raise exception using errcode = '22023', message = 'O nome de usuário do token é inválido.';
  end if;

  if jsonb_typeof(role_claims) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'O token não contém papéis válidos.';
  end if;

  select count(*)
    into role_count
    from unnest(array['student', 'parent', 'tutor']) as roles(role_name)
    where role_claims ? roles.role_name;

  if role_count <> 1 then
    raise exception using
      errcode = '22023',
      message = 'O usuário deve ter exatamente um papel da aplicação.';
  end if;

  if role_claims ? 'student' then
    profile_role := 'student';
  elsif role_claims ? 'parent' then
    profile_role := 'parent';
  else
    profile_role := 'tutor';
  end if;

  insert into public.profiles (id, username, role, full_name)
  values (
    external_id,
    username_value,
    profile_role,
    nullif(btrim(claims ->> 'name'), '')
  )
  on conflict (id) do nothing;

  select *
    into result
    from public.profiles
    where id = external_id;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'O perfil não foi criado para este usuário.';
  end if;

  if result.username is distinct from username_value
    or result.role::text is distinct from profile_role::text then
    raise exception using
      errcode = '42501',
      message = 'O perfil existente não corresponde aos papéis assinados pelo provedor.';
  end if;

  return result;
end;
$$;

revoke all on function public.ensure_keycloak_profile() from public, anon;
grant execute on function public.ensure_keycloak_profile() to authenticated;

create policy "Profiles can be read by their owner"
  on public.profiles for select to authenticated
  using (id = (select auth.jwt() ->> 'sub'));

create policy "Profiles can be updated by their owner"
  on public.profiles for update to authenticated
  using (id = (select auth.jwt() ->> 'sub'))
  with check (id = (select auth.jwt() ->> 'sub'));

create policy "Keycloak issuer required for profiles"
  on public.profiles as restrictive for all to authenticated
  using (public.is_trusted_keycloak_token())
  with check (public.is_trusted_keycloak_token());

create policy "Parents and tutors can read their own student links"
  on public.parent_student_links for select to authenticated
  using (parent_id = (select auth.jwt() ->> 'sub'));

create policy "Students can read their own parent links"
  on public.parent_student_links for select to authenticated
  using (student_id = (select auth.jwt() ->> 'sub'));

create policy "Keycloak issuer required for parent student links"
  on public.parent_student_links as restrictive for all to authenticated
  using (public.is_trusted_keycloak_token())
  with check (public.is_trusted_keycloak_token());

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, avatar_url) on table public.profiles to authenticated;

revoke all on table public.parent_student_links from anon, authenticated;
grant select on table public.parent_student_links to authenticated;

grant usage on type public.app_role to authenticated;
