# Acesso por username com Supabase Auth

O app converte o username para um alias interno no domínio reservado
`users.caderno.invalid`. O alias não é uma caixa de e-mail e não aparece na interface.
O Supabase continua sendo responsável por autenticar e proteger a sessão.

## Preparar o projeto Supabase

1. Confirme que as migrations de perfis e de username foram aplicadas:
   - `20261123112000_profiles_and_parent_links.sql`
   - `20261123130000_supabase_username_login.sql`
   - `20261123140000_student_study_content.sql`
2. Não aplique `20261123124000_keycloak_oidc.sql`; ela pertence ao fluxo antigo de
   autenticação OIDC e converte os IDs para o formato incompatível com este fluxo.
3. Em **Authentication > Settings**, desative novos cadastros públicos. As contas
   desta versão são provisionadas somente pelo administrador.
4. Configure no deploy apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Nunca
   coloque a chave `service_role` no navegador.
5. Depois das migrations, execute `supabase/seed.sql` pelo SQL Editor do Dashboard,
   que usa um contexto administrativo. O script de validação local é
   `npm run validate:seed`.

As questões ficam em `questions`; o gabarito é carregado separadamente em
`question_answer_keys`. Não mova o gabarito para `src/data/seed.ts` nem para uma coluna
da tabela de questões. O acesso às questões e respostas também permanece bloqueado
enquanto a senha inicial não for trocada.

## Criar as três contas

No Dashboard Supabase, em **Authentication > Users**, crie e confirme cada usuário
com senha. Use estes aliases técnicos (sem caixa postal):

| Username do login | E-mail interno                   |
| ----------------- | -------------------------------- |
| `ALUVIFER`        | `aluvifer@users.caderno.invalid` |
| `LUCVBRE`         | `lucvbre@users.caderno.invalid`  |
| `LUFERA`          | `lufera@users.caderno.invalid`   |

As senhas temporárias devem ser digitadas diretamente no Dashboard pelo administrador,
nunca inseridas no repositório, em SQL versionado ou no frontend. O trigger cria cada
perfil como `student` e com `must_change_password = true`. Depois de criar os usuários,
execute uma única vez no SQL Editor do Dashboard:

```sql
update public.profiles
set role = 'parent'
where username in ('lucvbre', 'lufera');
```

`parent` é o papel de acesso comum aos dois tutores; ambos recebem as mesmas permissões.
O aluno permanece `student`. A role não pode ser alterada pelo cliente.

## Primeiro acesso e validação

1. Inicie o app com `npm run dev` e acesse `/login`.
2. Entre com o username e a senha temporária.
3. O app deve exigir a criação de uma nova senha antes de abrir o painel.
4. Depois da troca, confirme que aluno e tutores conseguem entrar e sair. Confirme
   também que o perfil do aluno cai no painel de aluno e os dois tutores no mesmo
   painel de tutor.

Depois de aplicar as migrations e o seed, o aluno terá acesso às 105 questões. O painel
dos tutores permanece limitado até a fase de acompanhamento. As datas de prova de
Matemática ficam em branco até serem confirmadas com a escola, pois o calendário
oficial anexado diverge do cronograma transcrito no caderno. Não use senha temporária
fraca em produção.
