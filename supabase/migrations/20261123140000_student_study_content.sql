create type public.student_answer_status as enum ('draft', 'submitted', 'reviewed');

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  scheduled_date date,
  exam_date date,
  question_count integer not null check (question_count >= 0),
  icon text not null
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  number integer not null check (number > 0),
  block text not null,
  statement text not null,
  hints jsonb not null default '[]'::jsonb check (jsonb_typeof(hints) = 'array'),
  scaffold text,
  created_at timestamptz not null default now(),
  constraint questions_subject_number_unique unique (subject_id, number)
);

create table public.question_answer_keys (
  question_id uuid primary key references public.questions (id) on delete cascade,
  answer_key text not null,
  explanation text
);

create table public.student_answers (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  answer_text text not null default '',
  status public.student_answer_status not null default 'draft',
  self_score integer,
  teacher_feedback text,
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint student_answers_student_question_unique unique (student_id, question_id)
);

create index questions_subject_id_idx on public.questions (subject_id, number);
create index student_answers_question_id_idx on public.student_answers (question_id);
create index student_answers_student_id_idx on public.student_answers (student_id);

alter table public.subjects enable row level security;
alter table public.questions enable row level security;
alter table public.question_answer_keys enable row level security;
alter table public.student_answers enable row level security;

create or replace function public.password_change_completed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and must_change_password = false
  );
$$;

revoke all on function public.password_change_completed() from public, anon;
grant execute on function public.password_change_completed() to authenticated;

create policy "Authenticated users can read subjects"
  on public.subjects for select to authenticated
  using (public.password_change_completed());

create policy "Authenticated users can read questions"
  on public.questions for select to authenticated
  using (public.password_change_completed());

create policy "Students and linked parents can read answers"
  on public.student_answers for select to authenticated
  using (
    public.password_change_completed()
    and (
      student_id = (select auth.uid())
      or exists (
        select 1
        from public.parent_student_links as link
        where link.parent_id = (select auth.uid())
          and link.student_id = student_answers.student_id
          and link.status = 'active'
      )
    )
  );

create policy "Students can create their own answers"
  on public.student_answers for insert to authenticated
  with check (
    public.password_change_completed()
    and student_id = (select auth.uid())
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
    public.password_change_completed()
    and student_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and role = 'student'
    )
    and status = 'draft'
  )
  with check (
    public.password_change_completed()
    and student_id = (select auth.uid())
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
    public.password_change_completed()
    and (
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
    )
  );

create or replace function public.update_student_answer_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (
    new.student_id is distinct from old.student_id
    or new.question_id is distinct from old.question_id
  ) then
    raise exception using
      errcode = '23514',
      message = 'A questão e o aluno de uma resposta não podem ser alterados.';
  end if;

  new.updated_at := now();
  if new.status = 'submitted' then
    new.submitted_at := coalesce(new.submitted_at, now());
  elsif new.status = 'draft' then
    new.submitted_at := null;
  end if;
  return new;
end;
$$;

revoke all on function public.update_student_answer_timestamps() from public, anon, authenticated;

create trigger student_answers_set_timestamps
  before insert or update on public.student_answers
  for each row execute function public.update_student_answer_timestamps();

revoke all on table public.subjects, public.questions, public.question_answer_keys, public.student_answers
  from public, anon, authenticated;
grant select on table public.subjects, public.questions to authenticated;
grant select on table public.question_answer_keys to authenticated;
grant select on table public.student_answers to authenticated;
grant insert (student_id, question_id, answer_text, status)
  on table public.student_answers to authenticated;
grant update (student_id, question_id, answer_text, status)
  on table public.student_answers to authenticated;
grant usage on type public.student_answer_status to authenticated;
