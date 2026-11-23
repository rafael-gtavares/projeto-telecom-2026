# Portal Educacional CEFET/RJ — Cursos, Palestras e Eventos

Portal educacional do CEFET/RJ para cadastro, divulgação e gerenciamento de cursos, palestras e workshops. Desenvolvido como projeto de extensão, a plataforma centraliza em um só lugar o que antes era divulgado por meios informais — grupos de mensagens, murais físicos e e-mails avulsos. Quatro papéis de usuário, em hierarquia: **aluno**, **professor**, **admin** e **superadmin**.

🔗 **Deploy:** [projeto-telecom-2026-cefet-frontend.vercel.app](https://projeto-telecom-2026-cefet-frontend.vercel.app/)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Front-end | React 18, Vite, React Router v6, Tailwind CSS 3 |
| Back-end | Node.js, Express 4, Mongoose 8 |
| Banco de dados | MongoDB |
| Autenticação | JWT (access curto + refresh de 30 dias com "Lembrar-me" ou 1 dia sem) + bcrypt |
| Segurança | Helmet, rate limiting, sanitização contra injeção NoSQL |
| HTTP Client | Axios com interceptors (renovação automática do token) |
| Ícones | Lucide React |
| Gráficos | Recharts |
| Markdown | react-markdown + remark-gfm (conteúdo das aulas) |
| E-mail | Brevo (API HTTP) |
| Upload | Cloudinary (via Multer) |
| PDF | PDFKit (certificados) |

---

## Estrutura do projeto

```
projeto-telecom-2026/
├── cefet-backend/
│   ├── server.js           # Entrada: middlewares globais e montagem das rotas
│   └── src/
│       ├── assets/fonts/   # Fontes das assinaturas dos certificados
│       ├── config/         # DB, JWT, e-mail (Brevo), Cloudinary
│       ├── constants/      # Enums do domínio (papéis, status, situações…)
│       ├── controllers/    # Lógica de cada recurso
│       ├── helpers/        # Regras de negócio reutilizáveis (vagas, convites, cronograma, notas…)
│       ├── middleware/     # auth, papéis, acesso ao curso, conflito de horário, upload, erros
│       ├── models/         # Schemas do Mongoose
│       ├── routes/         # Definição dos endpoints
│       └── services/       # Certificado em PDF, envio de certificado, notificações, Cloudinary
└── cefet-frontend/
    └── src/
        ├── api/            # Funções Axios por recurso
        ├── components/
        │   ├── admin/      # Painel geral: dashboard, gráficos, usuários, escolas
        │   ├── courses/    # Cards, modais e abas de curso (aluno e gestor)
        │   ├── home/       # Hero, agenda e seções da Home
        │   ├── layout/     # Header, Footer, BottomNav, Sidebar, Drawer
        │   ├── markdown/   # Editor e visualização de Markdown
        │   ├── notifications/ # Sino de notificações
        │   └── ui/         # Componentes reutilizáveis: Button, Input, Modal, Toast, Tabs, Badge…
        ├── constants/      # Enums espelhados do backend
        ├── context/        # Autenticação e notificações (estado global)
        ├── hooks/          # useSchools, useToast, useConfirmModal
        ├── pages/          # Uma página por rota
        ├── routes/         # AppRoutes.jsx + PrivateRoute.jsx
        └── utils/          # Funções puras (datas, permissões, convites, turma fechada…)
```

---

## Como rodar

O projeto é um **monorepo** (npm workspaces). A partir da pasta raiz você instala e roda os dois projetos de uma vez.

### 1. Configurar os `.env`

```bash
cp cefet-backend/.env.example cefet-backend/.env
cp cefet-frontend/.env.example cefet-frontend/.env
# edite os valores conforme necessário (veja "Variáveis de ambiente")
```

O backend não sobe sem `JWT_SECRET`, `JWT_REFRESH_SECRET` e `MONGO_URI`.

### 2. Instalar e rodar (na raiz)

```bash
npm install   # instala as dependências do back e do front
npm run dev   # sobe os dois ao mesmo tempo
# Back-end:  http://localhost:3000
# Front-end: http://localhost:5173
```

### Scripts disponíveis na raiz

| Comando | O que faz |
|---|---|
| `npm install` | Instala dependências de ambos os workspaces |
| `npm run dev` | Roda back-end e front-end juntos (concurrently) |
| `npm run dev:back` | Só o back-end (nodemon) |
| `npm run dev:front` | Só o front-end |
| `npm run build` | Build de produção do front-end |
| `npm run preview` | Serve o build do front-end localmente |
| `npm run start` | Inicia o back-end em modo produção |

> Também é possível rodar cada projeto isoladamente entrando na pasta (`cd cefet-backend && npm run dev`).

No back-end existem ainda `npm run seed` (popula o banco com dados de demonstração) e `npm run seed:reset` (apaga o banco antes). Eles dependem de `cefet-backend/scripts/seedAll.js`, que não é versionado.

O projeto não tem suíte de testes automatizados nem linter configurado.

---

## Variáveis de ambiente

### Backend `.env`

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/cefet
JWT_SECRET=troque_por_uma_chave_segura
JWT_REFRESH_SECRET=troque_por_outra_chave_segura
JWT_EXPIRES_IN=15m                  # access token
JWT_REFRESH_EXPIRES_IN=30d          # refresh com "Lembrar-me"
JWT_REFRESH_SESSION_EXPIRES_IN=1d   # refresh sem "Lembrar-me"
CLIENT_URL=http://localhost:5173    # origem liberada no CORS e base dos links dos e-mails

# E-mail (Brevo)
BREVO_API_KEY=sua_chave_brevo
MAIL_FROM=noreply@seudominio.com

# Upload
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

NODE_ENV=production                 # opcional: confia no proxy e oculta mensagens de erro 500
```

### Frontend `.env`

```
VITE_API_URL=http://localhost:3000
```

---

## Endpoints da API

Todas as respostas seguem o formato `{ success, data?, message? }`. Há um limite global de 300 requisições a cada 15 minutos por IP, além dos limites específicos indicados abaixo.

**Legenda de acesso:** *Gestor do curso* = admin, superadmin, o professor que criou o curso ou um professor adicionado a ele. *Inscrito* = aluno com vaga no curso (não vale para quem está só na fila de espera).

### Autenticação — `/auth`

| Método | Rota | Descrição |
|---|---|---|
| POST | `/register` | Cadastro (limite: 5/h por IP) |
| POST | `/login` | Login (limite: 10/15min por IP) |
| POST | `/refresh` | Renovar access token |
| GET | `/verify-email?token=` | Verificar e-mail |
| POST | `/resend-verification` | Reenviar e-mail de verificação (limite: 5/15min) |
| POST | `/forgot-password` | Solicitar redefinição de senha (limite: 5/15min) |
| POST | `/reset-password?token=` | Redefinir senha (limite: 5/15min) |
| GET | `/validate-reset-token?token=` | Validar token de redefinição |

### Cursos — `/courses`

| Método | Rota | Acesso |
|---|---|---|
| GET | `/` | Público (catálogo; logado, traz inscrição, pré-requisitos e conflitos de horário) |
| GET | `/calendar` | Público (agenda de aulas de todos os cursos) |
| GET | `/all` | Professor+ (cursos que gerencia; admin vê todos) |
| GET | `/prerequisite-options` | Professor+ |
| GET | `/waitlist-sources` | Professor+ (cursos com fila de espera, para enviar convites) |
| POST | `/` | Professor+ |
| GET | `/:id` | Logado (rascunhos só para o gestor) |
| GET | `/:id/stats` | Professor+ |
| PUT | `/:id` | Gestor do curso |
| DELETE | `/:id` | Admin+ ou professor criador |
| POST | `/:id/allowed-professors` | Admin+ ou professor criador |
| DELETE | `/:id/allowed-professors/:professorId` | Admin+ ou professor criador |
| PATCH | `/:courseId/phase` | Gestor do curso |
| GET | `/:courseId/students` | Gestor do curso |
| GET | `/:courseId/certificate/pdf` | Aluno com certificado emitido (gestor pode pré-visualizar) |
| GET | `/:courseId/certificate-instructor-options` | Gestor do curso |
| PATCH | `/:id/certificate-settings` | Gestor do curso |
| GET | `/:courseId/waitlist` | Gestor do curso de origem (fila de espera para convites) |
| GET | `/:courseId/invitations` | Gestor do curso (convites enviados) |
| DELETE | `/:courseId/invitations/:id` | Gestor do curso (cancela o convite e libera a vaga) |

Na criação e na edição, o corpo pode trazer:
- `restrictedSchools` e `accessCode`, para fechar a turma para escola(s);
- `invitations: { sourceCourseId, studentIds, days }`, para convidar a fila de espera de outro curso.

### Conteúdo do curso — `/courses/:courseId/...`

| Recurso | Leitura | Escrita |
|---|---|---|
| `/lessons` | Gestor ou inscrito | Gestor do curso |
| `/materials` | Gestor ou inscrito | Gestor do curso |
| `/announcements` | Gestor ou inscrito | Gestor do curso |
| `/assessments` | Gestor do curso (`GET /my`: notas do próprio aluno) | Gestor do curso (avaliações, configuração de cálculo e notas em lote) |
| `/feedback` | Inscrito (formulário e resposta) | Gestor monta o formulário e vê os resultados; inscrito responde |

### Inscrições — `/enrollments`

| Método | Rota | Acesso |
|---|---|---|
| POST | `/` | Logado (inscreve ou coloca na fila de espera; turma fechada exige `accessCode`) |
| GET | `/my` | Logado |
| GET | `/check/:courseId` | Logado (situação da inscrição e dos pré-requisitos) |
| GET | `/conflicts/:courseId` | Logado (conflitos de horário com as inscrições atuais) |
| DELETE | `/:courseId` | Logado (cancela inscrição ou sai da fila) |
| PUT | `/:id/situation` | Professor+ |
| PATCH | `/:id/certificate` | Professor+ (emitir/revogar certificado) |
| GET | `/user/:userId` | Admin |

`POST /enrollments` e o pedido de vaga aceitam até 15 tentativas com erro a cada 15 minutos por usuário, para dificultar a adivinhação do código de turmas fechadas.

### Solicitações de vaga (cursos com aprovação)

| Método | Rota | Acesso |
|---|---|---|
| POST | `/courses/:courseId/enrollment-requests` | Logado (turma fechada exige `accessCode`) |
| GET | `/enrollment-requests/my` | Logado |
| DELETE | `/enrollment-requests/:id` | Aluno dono da solicitação |
| GET | `/courses/:courseId/enrollment-requests` | Gestor do curso |
| PATCH | `/courses/:courseId/enrollment-requests/:id/approve` | Gestor do curso |
| PATCH | `/courses/:courseId/enrollment-requests/:id/reject` | Gestor do curso |

### Convites — `/invitations`

| Método | Rota | Acesso |
|---|---|---|
| GET | `/my` | Logado (convites recebidos) |
| POST | `/:id/accept` | Aluno convidado |
| POST | `/:id/decline` | Aluno convidado |

### Usuários — `/users`

| Método | Rota | Acesso |
|---|---|---|
| GET | `/me` | Logado |
| PUT | `/me` | Logado (nome e nascimento só com permissão, para alunos) |
| PUT | `/me/signature` | Professor+ (assinatura do certificado) |
| GET | `/base` | Professor+ (lista resumida para seletores) |
| GET | `/` | Admin |
| PUT | `/:id/role` | Admin (só superadmin promove a admin) |
| PUT | `/:id/editPermission` | Admin |
| PUT | `/:id/personal-info` | Admin (dados do superadmin só pelo superadmin) |

### Escolas — `/schools`

| Método | Rota | Acesso |
|---|---|---|
| GET | `/` | Público (escolas ativas) |
| GET | `/all` | Admin |
| POST | `/` | Admin |
| PUT | `/:id` | Admin |
| DELETE | `/:id` | Admin |

### Outros

| Método | Rota | Acesso |
|---|---|---|
| GET | `/notifications` | Logado |
| PATCH | `/notifications/read-all` · `/notifications/:id/read` | Logado |
| POST | `/upload` | Professor+ (imagens, PDF e Word, até 10 MB) |
| GET | `/admin/stats` | Professor+ |
| POST | `/usage/visit` | Público (registro de acessos) |
| GET | `/usage/access` | Admin |
| GET | `/feedbacks/featured` · `/feedbacks/course/:idCourse` | Público (depoimentos) |
| POST | `/feedbacks` | Logado |
| GET / PUT | `/feedbacks` · `/feedbacks/:id` | Admin (listar e destacar depoimentos) |
| DELETE | `/feedbacks/:id` | Autor ou admin |
| GET | `/health` | Público |

---

## Papéis e permissões

| Role | Permissões |
|---|---|
| `aluno` | Ver cursos publicados, se inscrever ou entrar na fila, solicitar vaga, aceitar convites, cancelar inscrição, acessar o conteúdo dos cursos inscritos, responder feedback, baixar certificado, editar o próprio perfil |
| `professor` | Tudo do aluno + criar cursos e gerenciar os seus (e aqueles em que foi adicionado): aulas, materiais, avisos, avaliações, alunos, candidatos, convites, certificados e feedback; acessar o dashboard |
| `admin` | Tudo do professor em qualquer curso + gerenciar usuários (alunos e professores), escolas e depoimentos |
| `superadmin` | Tudo do admin + promover usuários a admin. Seus dados não podem ser alterados por admins |

As regras de permissão do front ficam centralizadas em `cefet-frontend/src/utils/permissions.js` e espelham as do backend (`requireMinimumRole`).

---

## Páginas

| Rota | Página | Acesso |
|---|---|---|
| `/` | Home: hero, catálogo de cursos com filtros, agenda e depoimentos | Público |
| `/login` | Login com opção "Lembrar-me" | Público |
| `/cadastro` | Cadastro com indicador de força de senha | Público |
| `/verificar-pendente` | Aviso para verificar o e-mail após o cadastro | Público |
| `/verificar-email` | Confirmação do link de verificação | Público |
| `/esqueci-senha` | Solicitar redefinição de senha | Público |
| `/redefinir-senha` | Formulário de nova senha | Público |
| `/meus-cursos` | Cursos inscritos, em andamento e concluídos, e aba **Convites** (`?tab=convites`) | Logado |
| `/meu-curso/:courseId` | Painel do aluno: sobre, cronograma, material, avisos, avaliações, feedback, certificado e plataforma externa | Logado (inscrito) |
| `/meu-perfil` | Dados pessoais, escola, senha e assinatura (professores) | Logado |
| `/admin` | Dashboard com métricas e gráficos | Professor+ |
| `/admin/cursos` | Listagem e criação de cursos | Professor+ |
| `/admin/usuarios` | Gerenciamento de usuários e papéis | Admin |
| `/admin/escolas` | Gerenciamento de escolas | Admin |
| `/admin/feedbacks` | Moderação de depoimentos | Admin |
| `/admin/curso/:courseId` | Painel do curso: aulas, alunos (e convites enviados), candidatos, avaliações, material, avisos, dashboard, feedbacks e configurações | Professor+ (gestor do curso) |

---

## Funcionalidades principais

- **Autenticação completa:** cadastro, login, verificação de e-mail, recuperação de senha e refresh token com "Lembrar-me".
- **Segurança:** rate limiting no login, no cadastro e nas inscrições; Helmet; sanitização contra injeção NoSQL; limite de tamanho do corpo das requisições.
- **Catálogo de cursos:** filtros por modalidade (presencial, EAD, semipresencial, palestra, workshop e outros), busca por texto e paginação com "Ver mais".
- **Cronogramas flexíveis:** data única, semanal ou datas personalizadas. As aulas são geradas e reconciliadas automaticamente quando o cronograma muda.
- **Status automático pelas datas:** o curso passa de publicado para em andamento e encerrado conforme as datas (no fuso de Brasília), e as inscrições acompanham.
- **Inscrições com controle de vagas:**
  - Fila de espera com posição; quando alguém cancela, o primeiro da fila é promovido.
  - Cursos com inscrição aberta ou com aprovação do professor (aba Candidatos).
  - Pré-requisitos: o aluno só se inscreve depois de concluir os cursos exigidos.
  - Bloqueio por conflito de horário com outros cursos em que o aluno está inscrito.
- **Convites para a fila de espera:**
  - Ao criar ou editar um curso, o professor pode convidar quem ficou na fila de espera de outro curso, por exemplo de uma edição anterior.
  - Cada convite reserva uma vaga até o prazo, definido em dias, que não pode ultrapassar o início do curso.
  - Se o convite vence ou é recusado, a vaga vai para o primeiro da fila do curso.
  - O aluno recebe notificação e e-mail, e responde na aba Convites de Meus Cursos.
- **Turma fechada para escola(s):**
  - O curso pode ser liberado só para alunos de uma ou mais escolas.
  - Para entrar, o aluno precisa ter uma dessas escolas no perfil e digitar o código de acesso.
  - O código é gerado automaticamente, pode ser personalizado e fica visível no painel do curso com botão de copiar.
  - O curso continua aparecendo na Home, com o aviso de turma fechada.
- **Painel do aluno por curso:**
  - Sobre (instrutor, datas, local), cronograma em calendário interativo, materiais e avisos.
  - Avaliações com notas e situação final, formulário de feedback e certificado.
- **Conteúdo das aulas em Markdown** e **exercícios por aula** (múltipla escolha com correção imediata).
- **Avaliações e notas:** provas, trabalhos e participação, com cálculo por soma, média simples ou média ponderada, nota mínima configurável e lançamento de notas em lote.
- **Certificados em PDF:**
  - O gestor libera o certificado de cada aluno.
  - É possível escolher quem assina e a fonte da assinatura; essa escolha fica travada depois da primeira emissão.
  - O certificado também é enviado por e-mail.
- **Feedback e depoimentos:** formulário por curso (múltipla escolha, estrelas e texto) com resultados agregados, e depoimentos públicos com destaque na Home.
- **Avisos e notificações:** avisos para a turma toda ou para um aluno, além de notificações no sino para material novo, notas, avisos, aulas, cronograma, certificado, feedback, solicitações e convites.
- **Plataforma externa:** cursos ministrados fora do portal exibem o link e as instruções apenas para os inscritos.
- **Gestão compartilhada:** o criador pode adicionar outros professores ao curso.
- **Dashboard de métricas:**
  - Totais de cursos, alunos e inscrições, e ocupação média.
  - Gráficos por mês, sexo, faixa etária, escolaridade, renda e escola de origem.
  - Estatísticas de acesso ao site.
- **Gerenciamento de usuários e escolas:** busca, filtro por papel, alteração de papel, permissão para o aluno editar nome e nascimento, correção de dados cadastrais e observações por escola.
- **Modo de visualização em lista ou cards**, lembrado no navegador.

---

## Tema visual

- Cor primária: `#1565C0` (Azul CEFET)
- Fonte: DM Sans
- Design: Mobile First, tema claro, com um "modo Telecom" alternativo na Home
- Componentes UI próprios: `Button`, `Input`, `Modal`, `ConfirmModal`, `Toast`, `Tabs`, `Badge`, `Avatar`, `Spinner`

---

Desenvolvido como projeto de extensão — CEFET/RJ · 2026
