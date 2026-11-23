# Configuração do Keycloak

## Desenvolvimento local

1. Inicie o Docker Desktop.
2. Copie `.env.keycloak.example` para `.env.keycloak.local` e defina uma senha forte para o administrador local do Keycloak.
3. Copie `.env.example` para `.env.local` e preencha as variáveis do Supabase e do Keycloak. Não use a chave `service_role` no navegador.
4. Inicie o servidor local:

   ```powershell
   docker compose --env-file .env.keycloak.local up -d
   ```

5. Acesse `http://localhost:8080/admin` com o usuário e a senha definidos no arquivo local. O realm `caderno-inteligente` e o cliente OIDC são importados automaticamente.
6. Para parar o serviço:

   ```powershell
   docker compose --env-file .env.keycloak.local down
   ```

O compose usa `start-dev` e armazenamento de desenvolvimento. Não o use como configuração de produção.

## Cadastro sem e-mail individual

O realm permite cadastro público e define `student` como papel padrão. O cadastro não permite escolher `tutor`; o administrador deve atribuir esse papel no Keycloak. Para que a tela de cadastro não exija e-mail:

1. No Admin Console, abra **Realm settings > User profile > JSON Editor**.
2. Edite o atributo `email`: deixe-o opcional para usuários e visível/editável somente por administradores. Não habilite verificação ou recuperação por e-mail.
3. Mantenha `username` obrigatório para usuários.

O modelo exige exatamente um papel da aplicação por usuário. Para criar um tutor, remova o papel padrão `student` e atribua `tutor`. Os papéis `parent` e `tutor` têm as mesmas permissões de leitura de vínculos; novos cadastros públicos recebem apenas `student`.

Não inclua usuários ou senhas no arquivo de exportação do realm. Crie as contas pelo Admin Console e configure as credenciais diretamente no Keycloak.

## Integração OIDC com Supabase

O cliente inclui um claim JWT `role=authenticated` para acesso à Data API. No projeto Supabase:

1. Abra **Authentication > Sign In / Providers > Third-Party Auth** e adicione um provedor **Custom OIDC** com o issuer do realm.
2. Depois de aplicar a migration, registre o mesmo issuer na tabela de confiança:

   ```sql
   insert into public.trusted_auth_issuers (issuer)
   values ('https://SEU_HOST/realms/caderno-inteligente')
   on conflict (issuer) do nothing;
   ```

   O valor deve ser exatamente o issuer OIDC usado pelo Keycloak. A tabela não pode ser escrita por usuários autenticados comuns.
3. Confirme que o issuer e o `sub` dos tokens correspondem à configuração OIDC; faça o primeiro login de cada usuário para criar seu perfil.
4. Faça o vínculo de cada tutor ao aluno na etapa de vínculos (Fase 3). Até lá, a RLS não expõe dados de aluno sem vínculo.

O Supabase exige um issuer OIDC HTTPS acessível e configura provedores OIDC customizados pelo Dashboard; essa integração não é configurável pelo Supabase CLI local. O Keycloak local em `http://localhost:8080` serve para desenvolvimento da interface, mas não permite validar a autorização OIDC/RLS de um projeto Supabase remoto. Para o fluxo completo, publique o Keycloak em HTTPS e configure esse issuer no Dashboard.

## Segurança e operação

- Não versione `.env.local`, `.env.keycloak.local`, senhas ou tokens.
- O Keycloak deve usar armazenamento persistente e banco de dados apropriado antes de produção; o compose deste repositório é apenas para desenvolvimento.
- Não habilite reset ou verificação de senha por e-mail enquanto não houver endereços individuais.
- A atribuição de `tutor` é administrativa. Nunca permita que o usuário escolha esse papel no formulário público.
