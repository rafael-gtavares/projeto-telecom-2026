# CEFET Portal — Cursos, Palestras e Eventos

Portal educacional do CEFET/RJ para cadastro, divulgação e gerenciamento de cursos, palestras e workshops. Três papéis de usuário: **aluno**, **professor** e **admin**.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Front-end | React 18, Vite, React Router v6, Tailwind CSS 3 |
| Back-end | Node.js, Express 4, Mongoose 8 |
| Banco de dados | MongoDB |
| Autenticação | JWT (access 1h + refresh 30d) + bcrypt |
| HTTP Client | Axios com interceptors |
| Ícones | Lucide React |
| Gráficos | Recharts |
| E-mail | Nodemailer (Mailtrap em dev) |

---

## Estrutura do projeto

```
projeto-telecom-2026-emailandschool/
├── cefet-backend/
│   └── src/
│       ├── config/         # DB, JWT, email
│       ├── controllers/    # Lógica de negócio
│       ├── middleware/     # auth, roles, upload, errorHandler
│       ├── models/         # Mongoose schemas
│       └── routes/         # Definição de endpoints
└── cefet-frontend/
    └── src/
        ├── api/            # Funções Axios por recurso
        ├── components/
        │   ├── admin/      # Painel admin/professor (gráficos, tabelas)
        │   ├── courses/    # Cards, modais, detalhes de cursos
        │   ├── layout/     # Header, Footer, BottomNav, Sidebar
        │   └── ui/         # Componentes reutilizáveis: Button, Input, Modal, Toast, Tabs, Badge
        ├── context/        # AuthContext (estado global de autenticação)
        ├── hooks/          # Custom hooks (useSchools, useAuth…)
        ├── pages/          # Uma página por rota
        ├── routes/         # AppRoutes.jsx + PrivateRoute.jsx
        └── utils/          # Funções puras (formatDate, formatModality…)
```

---

## Como rodar

### 1. Back-end

```bash
cd cefet-backend
npm install

# Copie e edite o .env
cp .env.example .env

npm run dev
# API rodando em http://localhost:3000
```

### 2. Front-end

```bash
cd cefet-frontend
npm install

# Copie e edite o .env
cp .env.example .env

npm run dev
# App rodando em http://localhost:5173
```

---

## Variáveis de ambiente

### Backend `.env`

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/cefet
JWT_SECRET=troque_por_uma_chave_segura
JWT_REFRESH_SECRET=troque_por_outra_chave_segura
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173

# E-mail (Mailtrap em dev)
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=seu_usuario_mailtrap
MAIL_PASS=sua_senha_mailtrap
```

### Frontend `.env`

```
VITE_API_URL=http://localhost:3000
```

---

## Endpoints da API

### Autenticação — `/api/auth`

| Método | Rota | Descrição |
|---|---|---|
| POST | `/register` | Cadastro (rate limit: 5/h por IP) |
| POST | `/login` | Login (rate limit: 10/15min por IP) |
| POST | `/refresh` | Renovar access token |
| GET | `/verify-email?token=` | Verificar e-mail |
| POST | `/resend-verification` | Reenviar e-mail de verificação |
| POST | `/forgot-password` | Solicitar redefinição de senha |
| POST | `/reset-password?token=` | Redefinir senha |
| GET | `/validate-reset-token?token=` | Validar token de reset |

### Cursos — `/api/courses`

| Método | Rota | Acesso |
|---|---|---|
| GET | `/` | Público |
| POST | `/` | Admin / Professor |
| GET | `/:id` | Público |
| PUT | `/:id` | Admin / Professor dono |
| DELETE | `/:id` | Admin / Professor dono |

### Aulas — `/api/courses/:courseId/lessons`

| Método | Rota | Acesso |
|---|---|---|
| GET | `/` | Logado (inscrito ou dono do curso) |
| POST | `/` | Admin / Professor dono |
| PUT | `/:lessonId` | Admin / Professor dono |
| DELETE | `/:lessonId` | Admin / Professor dono |

### Materiais — `/api/courses/:courseId/materials`

| Método | Rota | Acesso |
|---|---|---|
| GET | `/` | Logado (inscrito ou dono do curso) |
| POST | `/` | Admin / Professor dono |
| PUT | `/:materialId` | Admin / Professor dono |
| DELETE | `/:materialId` | Admin / Professor dono |

### Notas — `/api/courses/:courseId/grades`

| Método | Rota | Acesso |
|---|---|---|
| GET | `/my` | Aluno logado (próprias notas) |
| GET | `/` | Admin / Professor dono |
| POST | `/` | Admin / Professor dono |
| PUT | `/:gradeId` | Admin / Professor dono |
| DELETE | `/:gradeId` | Admin / Professor dono |

### Inscrições — `/api/enrollments`

| Método | Rota | Acesso |
|---|---|---|
| POST | `/` | Aluno logado |
| GET | `/my` | Aluno logado |
| GET | `/check/:courseId` | Aluno logado (verificar inscrição) |
| DELETE | `/:courseId` | Aluno logado (cancelar) |

### Usuários — `/api/users`

| Método | Rota | Acesso |
|---|---|---|
| GET | `/me` | Logado |
| PUT | `/me` | Logado |
| GET | `/` | Admin |
| PUT | `/:id/role` | Admin |

### Escolas — `/api/schools`

| Método | Rota | Acesso |
|---|---|---|
| GET | `/` | Logado |

### Admin / Métricas — `/api/admin`

| Método | Rota | Acesso |
|---|---|---|
| GET | `/stats` | Admin / Professor |

---

## Papéis e permissões

| Role | Permissões |
|---|---|
| `aluno` | Ver cursos publicados, se inscrever, cancelar inscrição, acessar materiais e aulas dos cursos inscritos, editar próprio perfil |
| `professor` | Tudo do aluno + criar/editar/excluir próprios cursos, gerenciar aulas, materiais e notas, acessar dashboard de métricas |
| `admin` | Tudo do professor + editar qualquer curso, gerenciar usuários e papéis |

---

## Páginas

| Rota | Página | Acesso |
|---|---|---|
| `/` | Home — hero, mural de cursos com filtros | Público |
| `/login` | Login com opção "lembrar por 30 dias" | Público |
| `/cadastro` | Cadastro com indicador de força de senha | Público |
| `/verificar-pendente` | Aviso para verificar e-mail após cadastro | Público |
| `/verificar-email` | Confirmação do link de verificação | Público |
| `/esqueci-senha` | Solicitar redefinição de senha | Público |
| `/redefinir-senha` | Formulário de nova senha | Público |
| `/meus-cursos` | Cursos inscritos e concluídos, modo lista ou cards | Logado |
| `/meu-curso/:courseId` | Painel do aluno: sobre, cronograma, materiais, notas | Logado (inscrito) |
| `/meu-perfil` | Edição de dados pessoais e senha | Logado |
| `/admin` | Dashboard com métricas e gráficos | Admin / Professor |
| `/admin/curso/:courseId` | Painel do curso: edição, aulas, materiais, alunos, notas | Admin / Professor |

---

## Funcionalidades principais

- **Autenticação completa** — cadastro, login, verificação de e-mail, recuperação de senha, refresh token
- **Rate limiting** — proteção contra força bruta em login e cadastro
- **Catálogo de cursos** — filtros por modalidade, busca por texto, paginação com "Ver mais"
- **Inscrição em cursos** — controle de vagas, status (inscrito → ativo → concluído)
- **Sync de status de inscrição** — ao alterar o status do curso, as inscrições dos alunos são atualizadas automaticamente
- **Painel do aluno por curso** — aba Sobre (instrutor, datas, local), Cronograma (calendário com marcação de início/término), Materiais, Notas
- **Painel admin do curso** — tabs Informações, Aulas, Materiais, Alunos, Notas, Configurações
- **Alteração de status com confirmação** — modal de confirmação antes de alterar o status do curso
- **Dashboard de métricas** — total de cursos, alunos, inscrições, gráficos por modalidade e escola de origem
- **Modo de visualização em Meus Cursos** — alternar entre lista e cards (persistido no localStorage)
- **Instrutor / Palestrante** — campo independente do professor que criou o curso, exibido para o aluno

---

## Tema visual

- Cor primária: `#1565C0` (Azul CEFET)
- Fonte: DM Sans
- Design: Mobile First, tema claro
- Componentes UI próprios: `Button`, `Input`, `Modal`, `Toast`, `Tabs`, `Badge`, `Spinner`
