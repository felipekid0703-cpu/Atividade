create type public.app_role as enum ('student', 'parent');
create type public.parent_student_link_status as enum ('pending', 'active', 'revoked');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status public.parent_student_link_status not null default 'pending',
  created_at timestamptz not null default now(),
  constraint parent_student_links_unique_pair unique (parent_id, student_id),
  constraint parent_student_links_distinct_users check (parent_id <> student_id)
);

create index parent_student_links_parent_id_idx
  on public.parent_student_links (parent_id);
create index parent_student_links_student_id_idx
  on public.parent_student_links (student_id);

alter table public.profiles enable row level security;
alter table public.parent_student_links enable row level security;

create policy "Profiles can be read by their owner"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "Profiles can be updated by their owner"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Parents can read their own student links"
  on public.parent_student_links for select to authenticated
  using (parent_id = (select auth.uid()));

create policy "Students can read their own parent links"
  on public.parent_student_links for select to authenticated
  using (student_id = (select auth.uid()));

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, avatar_url) on table public.profiles to authenticated;

revoke all on table public.parent_student_links from anon, authenticated;
grant select on table public.parent_student_links to authenticated;

grant usage on type public.app_role to authenticated;
grant usage on type public.parent_student_link_status to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
begin
  requested_role := new.raw_user_meta_data ->> 'role';

  if requested_role is null or requested_role not in ('student', 'parent') then
    raise exception using
      errcode = '22023',
      message = 'O papel de cadastro deve ser student ou parent.';
  end if;

  insert into public.profiles (id, role, full_name, email, avatar_url)
  values (
    new.id,
    requested_role::public.app_role,
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    new.email,
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  );

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
