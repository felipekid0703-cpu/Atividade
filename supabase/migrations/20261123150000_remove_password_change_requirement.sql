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
      message = 'O nome de usuario da conta e invalido.';
  end if;

  insert into public.profiles (
    id,
    role,
    username,
    full_name,
    email,
    avatar_url
  )
  values (
    new.id,
    'student',
    username_value,
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    new.email,
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  );

  return new;
end;
$$;

drop policy if exists "Authenticated users can read subjects" on public.subjects;
drop policy if exists "Authenticated users can read questions" on public.questions;
drop policy if exists "Students and linked parents can read answers" on public.student_answers;
drop policy if exists "Students can create their own answers" on public.student_answers;
drop policy if exists "Students can edit their own drafts" on public.student_answers;
drop policy if exists "Answer keys require a submitted answer" on public.question_answer_keys;

drop trigger if exists on_auth_user_password_changed on auth.users;
drop function if exists public.mark_profile_password_changed();
drop function if exists public.password_change_completed();
alter table public.profiles drop column if exists must_change_password;

create policy "Authenticated users can read subjects"
  on public.subjects for select to authenticated
  using (true);

create policy "Authenticated users can read questions"
  on public.questions for select to authenticated
  using (true);

create policy "Students and linked parents can read answers"
  on public.student_answers for select to authenticated
  using (
    student_id = (select auth.uid())
    or exists (
      select 1
      from public.parent_student_links as link
      where link.parent_id = (select auth.uid())
        and link.student_id = student_answers.student_id
        and link.status = 'active'
    )
  );

create policy "Students can create their own answers"
  on public.student_answers for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and role = 'student'
    )
    and status in ('draft', 'submitted')
    and (status = 'draft' or length(btrim(answer_text)) > 0)
  );

create policy "Students can edit their own drafts"
  on public.student_answers for update to authenticated
  using (
    student_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and role = 'student'
    )
    and status = 'draft'
  )
  with check (
    student_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and role = 'student'
    )
    and status in ('draft', 'submitted')
    and (status = 'draft' or length(btrim(answer_text)) > 0)
  );

create policy "Answer keys require a submitted answer"
  on public.question_answer_keys for select to authenticated
  using (
    exists (
      select 1
      from public.student_answers as answer
      where answer.question_id = question_answer_keys.question_id
        and answer.student_id = (select auth.uid())
        and answer.status in ('submitted', 'reviewed')
    )
    or exists (
      select 1
      from public.parent_student_links as link
      join public.student_answers as answer
        on answer.student_id = link.student_id
      where link.parent_id = (select auth.uid())
        and link.status = 'active'
        and answer.question_id = question_answer_keys.question_id
        and answer.status in ('submitted', 'reviewed')
    )
  );
