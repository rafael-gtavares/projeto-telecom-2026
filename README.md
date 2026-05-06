# CEFET Portal — Cursos, Palestras e Eventos

Portal completo para o CEFET/RJ divulgar cursos, palestras e eventos acadêmicos.

---

## Stack

| Camada | Tecnologias |
|---|---|
| Front-end | React + Tailwind CSS + React Router DOM v6 |
| Back-end | Node.js + Express |
| Banco de dados | MongoDB + Mongoose |
| Autenticação | JWT (accessToken + refreshToken) |

---

## Estrutura de repositórios

```
cefet-backend/    ← API Express
cefet-frontend/   ← React App
```

---

## Como rodar

### 1. Back-end

```bash
cd cefet-backend
npm install

# Copie e edite o .env
cp .env.example .env
# Edite MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET

npm run dev
# API rodando em http://localhost:3000
```

### 2. Front-end

```bash
cd cefet-frontend
npm install

# Copie e edite o .env
cp .env.example .env
# VITE_API_URL=http://localhost:3000

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
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:3000
```

---

## Endpoints da API

| Método | Rota | Acesso |
|---|---|---|
| POST | /auth/register | Público |
| POST | /auth/login | Público |
| POST | /auth/refresh | Público |
| GET | /courses | Público |
| POST | /courses | Admin / Professor |
| PUT | /courses/:id | Admin / Professor dono |
| DELETE | /courses/:id | Admin / Professor dono |
| POST | /enrollments | Aluno logado |
| GET | /enrollments/my | Logado |
| GET | /users/me | Logado |
| PUT | /users/me | Logado |
| GET | /users | Admin |
| PUT | /users/:id/role | Admin |
| GET | /admin/stats | Admin / Professor |

---

## Roles

| Role | Permissões |
|---|---|
| `aluno` | Ver cursos, se inscrever, editar perfil |
| `professor` | + Criar/editar cursos próprios, ver dashboard |
| `admin` | + Editar todos os cursos, gerenciar permissões |

---

## Páginas

- `/` — Home com hero, parceiros, diferenciais e mural de cursos
- `/login` — Login com JWT e opção "lembrar por 30 dias"
- `/cadastro` — Cadastro completo com indicador de força de senha
- `/meus-cursos` — Cursos inscritos, em andamento e concluídos
- `/meu-perfil` — Edição de dados e senha
- `/admin` — Dashboard com métricas
- `/admin/cursos` — CRUD de cursos
- `/admin/usuarios` — Gestão de permissões (apenas admin)

---

## Tema visual

Cor primária: `#1565C0` (Azul CEFET)  
Fonte: DM Sans  
Design: Mobile First, tema claro, sem dark mode
