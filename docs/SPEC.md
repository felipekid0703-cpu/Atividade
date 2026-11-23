# ROLE

Você é um engenheiro de software sênior full-stack. Vai construir, de ponta a ponta,
uma aplicação web chamada "Caderno Inteligente 7º Ano" diretamente neste repositório.
Trabalhe de forma agêntica: crie arquivos, instale dependências, rode o dev server,
valide o build e só avance de fase quando eu confirmar.

# OBJETIVO

Digitalizar um caderno de atividades de preparação para avaliações trimestrais do 7º ano,
com DOIS PERFIS DE LOGIN independentes e simultâneos:

- ALUNO: responde questões, salva rascunhos, vê progresso e cronograma.
- PAI/RESPONSÁVEL: acompanha o progresso do filho vinculado, vê respostas e gabarito,
recebe notificações de prazos.

Requisitos: mobile-first, PWA instalável, tema claro/escuro, pt-BR, tempo real via Supabase.

# STACK (fixa)

React 18 + TypeScript + Vite
Tailwind CSS + shadcn/ui
Supabase (Auth + Postgres + RLS + Realtime)
React Router v6
TanStack Query v5
Zod + React Hook Form
Lucide React, date-fns (pt-BR), Sonner, Recharts

# ESTRUTURA DE PASTAS ESPERADA

src/
components/        (UI reutilizável + shadcn)
features/
auth/
student/
parent/
lib/               (supabase client, utils, validators)
data/              (seed.ts com 105 questões)
routes/            (react-router)
hooks/
types/
supabase/
migrations/        (SQL das tabelas + RLS)
seed.sql
tests/
e2e/               (Playwright)

# MODELO DE DADOS (Postgres / Supabase)

profiles(id uuid PK FK auth.users, role enum student|parent, full_name, email,
avatar_url, created_at)
parent_student_links(id uuid PK, parent_id FK profiles, student_id FK profiles,
status enum pending|active|revoked, created_at,
UNIQUE(parent_id, student_id))
subjects(id uuid PK, name, slug UNIQUE, scheduled_date date, question_count int, icon)
questions(id uuid PK, subject_id FK, number int, block text, statement text,
hints jsonb, answer_key text, created_at)
student_answers(id uuid PK, student_id FK, question_id FK, answer_text text,
status enum draft|submitted|reviewed, self_score int,
teacher_feedback text, submitted_at, updated_at,
UNIQUE(student_id, question_id))
study_sessions(id uuid PK, student_id FK, subject_id FK, started_at, ended_at,
questions_completed int, questions_total int)
notifications(id uuid PK, user_id FK, title, body,
type enum deadline|progress|link_request, read bool, created_at)

# RLS (obrigatória em todas as tabelas)

- profiles: SELECT/UPDATE só do próprio auth.uid()
- parent_student_links: parent vê onde parent_id = auth.uid();
student vê onde student_id = auth.uid()
- questions: SELECT liberado para autenticados; coluna answer_key só retornada se
(a) o aluno já enviou student_answers para aquela questão OU
(b) quem consulta é parent vinculado ativo ao aluno
- student_answers: student lê/escreve só as próprias; parent lê só do filho vinculado
- notifications: user lê só as próprias

# CRONOGRAMA E SEED (popular em src/data/seed.ts + supabase/seed.sql)

Datas (2026):

- Língua Inglesa — 23/11 — 20 questões
- Língua Portuguesa — 23/11 — 20 questões
- Matemática — Dia 1 — 23/11 — 15 questões
- Matemática — Dia 2 — 24/11 — 30 questões
- Filosofia — 26/11 — 20 questões
Total: 105 questões. NÃO incluir Geografia (não haverá avaliação tradicional).
Estruturar cada questão com: subject_slug, number, block, statement, hints[],
answer_key. Deixar o arquivo completo e tipado; se faltar conteúdo, criar
placeholders explícitos "TODO_CONTEUDO" que eu preencho depois.

# ROTAS

/                        → redirect conforme role
/login
/signup                  → escolha de role
/student/dashboard
/student/subject/:slug
/student/question/:id
/student/progress
/student/schedule
/parent/dashboard
/parent/child/:id
/parent/link-student
/parent/reports
/settings

# COMPONENTES-CHAVE

<RoleGuard allowed="student|parent" />
<QuestionCard />         (enunciado + hints + textarea + auto-save + ações)
<ProgressRing />         (Recharts ou conic-gradient)
<ScheduleTimeline />     (linha do tempo 23/11–27/11)
<SubjectCard />          (matéria + badge de status)
<ChildCard />            (filho no dashboard do pai)
<NotificationBell />     (dropdown com notificações em tempo real)

# COMPORTAMENTOS CRÍTICOS

1. Auto-save de rascunho a cada 2s no textarea de resposta (debounce).
2. Gabarito só liberado após envio da resposta (aluno) ou vínculo ativo (pai).
3. Supabase Realtime na tabela student_answers → pai vê atualizações ao vivo.
4. Dois logins simultâneos (aluno mobile + pai desktop) devem funcionar;
validar com teste manual e E2E.
5. Contagem regressiva para a próxima avaliação no dashboard.
6. PWA: manifest.json, service worker (offline shell), ícone, install prompt.
7. Tema claro/escuro persistente (localStorage + classe no <html>).

# FASES DE ENTREGA (pare e me mostre o resultado a cada fase)

## FASE 0 — Scaffold

- `npm create vite@latest . -- --template react-ts`
- Instalar dependências (lista completa)
- Configurar Tailwind, shadcn/ui, path aliases (@/), ESLint, Prettier
- Criar supabase client em src/lib/supabase.ts lendo VITE_SUPABASE_URL e
VITE_SUPABASE_ANON_KEY
- Criar .env.example
- Rodar `npm run dev` e confirmar que sobe em localhost:5173
**Critério:** dev server rodando, sem erros de TS.

## FASE 1 — Auth + Roles + Rotas protegidas

- Páginas /login, /signup (escolha de role), /settings
- Supabase Auth (email + senha; magic link opcional)
- Trigger SQL para criar profile automaticamente no signup
- <RoleGuard> e redirects por role
- Layout base (header com avatar, tema toggle, sino de notificações)
**Critério:** aluno e pai logam, vão para dashboards diferentes, logout funciona.

## FASE 2 — Aluno: dashboard + matéria + questões + auto-save

- Dashboard com próxima avaliação, cronograma da semana, progresso geral
- Tela de matéria listando blocos/questões
- Tela de questão com hints, textarea, auto-save, enviar
- Após envio: gabarito liberado
**Critério:** aluno responde uma questão, recarrega a página e o rascunho persiste.

## FASE 3 — Pai: vínculo + leitura + Realtime

- Dashboard do pai com cards dos filhos
- Fluxo de vínculo (convite por e-mail → aluno aceita)
- Tela "Progresso do filho" em modo leitura + gabarito
- Realtime: atualização ao vivo quando o filho envia resposta
**Critério:** aluno envia resposta no mobile; pai vê em <2s no desktop.

## FASE 4 — Progresso, cronograma, notificações, PWA

- Gráficos (pizza por matéria, streak de dias)
- Cronograma visual com checkboxes
- Notificações in-app (deadline, progress, link_request)
- PWA completo + install prompt
**Critério:** app instalável no celular, notificações chegam, tema persiste.

## FASE 5 — Testes E2E + Deploy

- Playwright: login duplo simultâneo, RLS (pai não vê filho de outro pai),
auto-save, liberação de gabarito, PWA install
- Configurar deploy Vercel (env vars)
- README.md com setup completo
**Critério:** `npm run test:e2e` verde; deploy acessível.

# REGRAS DE TRABALHO

- Antes de cada fase: liste os arquivos que vai criar/alterar e aguarde meu "ok".
- Depois de cada fase: rode `npm run build` e `npm run lint`; mostre o output.
- Commits pequenos e descritivos em cada fase (Conventional Commits).
- Nunca exponha answer_key no client sem checagem de RLS.
- Nunca commite .env.local nem chaves.
- Se faltar alguma decisão de produto, pergunte antes de assumir.
- Todo texto de UI em pt-BR.
- Cores: índigo (confiança), verde (progresso), âmbar (alertas). Fonte Inter.

# O QUE NÃO FAZER

- Não usar Firebase.
- Não criar chat pai↔filho.
- Não criar pagamentos.
- Não criar perfil de professor/turma nesta versão.
- Não avançar de fase sem meu "ok".

Comece pela FASE 0. Liste os arquivos que vai criar e aguarde meu "ok".

---

# ADENDO — DECISÕES POSTERIORES (SOBREPÕEM O TEXTO ACIMA EM CASO DE CONFLITO)

Status: a FASE 0 foi escrita e validada (install, build, lint e dev server OK).
Próxima: FASE 1, após o meu "ok".

## A1. Datas

- scheduled_date = dia de ESTUDO (como no cronograma do caderno).
- exam_date = scheduled_date + 1 dia. Adicionar a coluna exam_date (date) em subjects.
- A contagem regressiva do dashboard usa exam_date.
- Pendente de confirmação: Matemática Dia 2 tem estudo em 24/11 (prova em 25/11), mas o
caderno marca 25/11 como "descanso e revisão leve". Perguntar ao usuário a data real.
- Filosofia: estudo 26/11, prova 27/11 (sexta-feira).

## A2. Gabarito fora da tabela questions

- RLS do Postgres filtra linhas, não colunas. Portanto NÃO existe questions.answer_key.
- Criar question_answer_keys(question_id uuid PK FK questions, answer_key text,
explanation text).
- RLS de question_answer_keys, SELECT permitido se:
(a) existe student_answers do auth.uid() para a questão com status submitted ou reviewed; OU
(b) o usuário é pai com parent_student_links.status = 'active' para um aluno que
já enviou resposta (submitted/reviewed) àquela questão.
- Nenhuma política de INSERT/UPDATE/DELETE para usuários comuns (seed via migration/service role).

## A3. Roteiros do caderno

- Adicionar questions.scaffold (text, opcional) com os roteiros tipo "Montagem: ____" e
"Cálculo: ____". Não colocar em hints.

## A4. Stack

- Tailwind CSS v4 (sem tailwind.config.ts). shadcn/ui configurado para v4.

## A5. Conteúdo (seed)

Fontes: docs/caderno-aluno.txt (enunciados) e docs/gabarito-professor.txt (gabarito).

- Remover ruídos de cópia: "text", "📄 DOCUMENTO A/B", linhas de underscores e a duplicação
de fórmulas (ex.: "a b b a ​ = ..."). Escrever contas em texto simples
("12/18 = 2/3", "C = 2 × 3,14 × r").
- Corrigir Português Q19: o enunciado tem 5 lacunas de advérbios; remover "antes" do
gabarito (é locução, não advérbio).
- Corrigir Matemática Dia 1 Q9: em grandezas diretamente proporcionais a RAZÃO é constante
(não o "produto cruzado").
- Contagem obrigatória: Inglês 20, Português 20, Matemática Dia 1 = 15, Matemática Dia 2 = 30,
Filosofia 20 = 105. Criar script de validação que falhe se não bater.
- Cada questão: subject_slug, number, block, statement, hints[], scaffold, answer_key,
explanation (comentário do gabarito).

## A6. Segurança do cadastro

- O role (student|parent) vem do /signup via raw_user_meta_data. O trigger de criação de
profile aceita APENAS esses dois valores; qualquer outro deve gerar erro.
- Nunca usar a chave service_role no client. Somente a anon key no .env.local.
- Confirmação de e-mail desligada só em desenvolvimento; religar antes do deploy.