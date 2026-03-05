# Auth API

API de autenticação RESTful com suporte a JWT, refresh token e controle de permissões.

## Stack

- **NestJS** + **TypeScript**
- **PostgreSQL** + **MikroORM**
- **JWT** (access token + refresh token)
- **Docker Compose**

## Rodando com Docker (recomendado)

```bash
cp .env.example .env
# Preencha as variáveis no .env

docker compose up --build
```

A API ficará disponível em `http://localhost:3001`.

## Rodando localmente

```bash
npm install
cp .env.example .env
# Configure o .env apontando para seu PostgreSQL local

npm run migration:up
npm run seeder:run   # cria o usuário admin padrão
npm run start:dev
```

## Variáveis de ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `PORT_NUMBER` | Porta da aplicação | `3001` |
| `DATABASE_HOST` | Host do PostgreSQL | `localhost` |
| `DATABASE_PORT` | Porta do PostgreSQL | `5433` |
| `DATABASE_NAME` | Nome do banco | `api_infinity_check` |
| `DATABASE_USER` | Usuário do banco | `postgres` |
| `DATABASE_PASSWORD` | Senha do banco | `postgres` |
| `JWT_SECRET` | Chave JWT (mín. 32 chars) | `openssl rand -base64 32` |
| `JWT_ACCESS_EXPIRES_IN` | Expiração do access token | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Expiração do refresh token | `30d` |
| `ENCRYPTION_KEY` | Chave AES-256 (64 chars hex) | `openssl rand -hex 32` |

## Endpoints

### Autenticação

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/auth/login` | Público | Login com email e senha |
| `POST` | `/auth/refresh` | Público | Renova o par de tokens |
| `GET` | `/auth/me` | JWT | Retorna o usuário autenticado |
| `POST` | `/auth/register` | JWT + permissão `usuarios` | Cria novo usuário |

### Fluxo de autenticação

```
1. POST /auth/login
   Body: { "email": "...", "password": "..." }
   Response: { "access_token": "...", "refresh_token": "...", "user": {...} }

2. Usar access_token nas requisições:
   Authorization: Bearer <access_token>

3. Quando o access_token expirar (401), renovar:
   POST /auth/refresh
   Body: { "refresh_token": "..." }
   Response: { "access_token": "...", "refresh_token": "..." }
```

### Headers obrigatórios para POST/PUT/PATCH/DELETE

```
X-Requested-With: XMLHttpRequest
```

## Usuário admin padrão

Criado pelo seeder ao rodar `npm run seeder:run`:

```
Email:    admin@infinity.com
Senha:    12345678
```

## Documentação interativa (Swagger)

```
http://localhost:3001/api
```

## Scripts

```bash
npm run start:dev        # desenvolvimento com hot reload
npm run build            # compilar para produção
npm run migration:up     # executar migrations
npm run migration:down   # reverter última migration
npm run seeder:run       # popular banco com dados iniciais
npm run test             # testes unitários
npm run lint             # linting
```
