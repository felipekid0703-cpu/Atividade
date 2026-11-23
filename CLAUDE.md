# Caderno Inteligente 7º Ano

## Decisões de produto

- Toda a interface e as mensagens ao usuário devem estar em pt-BR.
- Os papéis permitidos são `student` (aluno) e `parent` (pai/responsável); o usuário não pode escolher ou obter outros papéis.
- Cada matéria tem `scheduled_date` (dia de estudo) e `exam_date` (dia da prova), sendo `exam_date = scheduled_date + 1 dia`. O dashboard usa a data da prova. A data real da prova de Matemática do dia 2 precisa ser confirmada com o usuário: estudo em 24/11, prova prevista em 25/11, embora o caderno marque 25/11 como descanso.
- O gabarito não pode ser armazenado em uma coluna de `questions` nem exposto ao cliente sem RLS. Deve ficar em `question_answer_keys`, com acesso condicionado a uma resposta enviada pelo aluno ou ao vínculo ativo do responsável com esse aluno.
- Roteiros como “Montagem” e “Cálculo” devem ficar em `questions.scaffold`, separados de `hints`.
- Usar Tailwind CSS v4, sem `tailwind.config.ts`.
- Não usar Firebase. O produto não inclui chat, pagamentos nem perfil de professor.
- O conteúdo do caderno deve ser limpo antes da criação do seed, com 105 questões: Inglês 20, Português 20, Matemática dia 1 15, Matemática dia 2 30 e Filosofia 20. Validar a contagem com um script que falhe se o total ou a distribuição estiver incorreta.
- No gabarito, Português Q19 deve corresponder às cinco lacunas do enunciado e Matemática dia 1 Q9 deve indicar que a razão é constante em grandezas diretamente proporcionais.

## Regras de trabalho

- Leia `docs/SPEC.md` integralmente antes de iniciar fases que dependam da especificação; consulte também `docs/caderno-aluno.txt` e `docs/gabarito-professor.txt` para o conteúdo.
- Trabalhe por fases. Antes de cada fase, liste os arquivos que serão criados ou alterados e aguarde a aprovação do usuário. Ao concluir uma fase, execute `npm run build` e `npm run lint`, e apresente os resultados.
- Se faltar uma decisão de produto, pergunte antes de assumir.
- Nunca exponha o gabarito ao cliente sem a proteção de RLS descrita acima.
- Não versione `.env.local`, credenciais ou chaves.
- Faça commits pequenos usando Conventional Commits.
