# CLAUDE.md - Projeto API Infinity Check

## Visão Geral do Projeto

API RESTful construída com **NestJS + MikroORM + PostgreSQL** seguindo as melhores práticas de segurança e arquitetura. O projeto implementa um sistema de checklist com multi-tenancy, autenticação JWT, criptografia AES-256-GCM e sistema de auditoria.

## Stack Tecnológica

- **NestJS** - Framework Node.js progressivo
- **MikroORM** - TypeScript ORM para PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação via JSON Web Tokens
- **Swagger** - Documentação automática da API
- **Helmet** - Segurança de headers HTTP
- **Joi** - Validação de variáveis de ambiente

## Comandos Principais

```bash
# Desenvolvimento
npm run start:dev          # Inicia em modo watch
npm run start:debug        # Inicia em modo debug

# Build
npm run build              # Compila o projeto

# Migrations
npm run migration:create   # Cria uma nova migration
npm run migration:up       # Executa migrations pendentes
npm run migration:down     # Reverte última migration

# Seeders
npm run seeder:run         # Executa seeders

# Testes
npm run test               # Executa testes unitários
npm run test:watch         # Executa testes em modo watch
npm run test:cov           # Gera relatório de cobertura

# Linting
npm run lint               # Executa ESLint
npm run format             # Formata código com Prettier
```

## Estrutura de Diretórios

```
src/
├── main.ts                          # Bootstrap da aplicação
├── app.module.ts                    # Módulo raiz
├── app.controller.ts                # Controller principal
├── app.service.ts                   # Service principal
├── settings.ts                      # Variáveis de ambiente
│
├── config/
│   ├── configuration.ts             # Configuração tipada
│   ├── env.validation.ts            # Validação Joi do .env
│   └── mikro-orm.config.ts          # Configuração do MikroORM
│
├── entities/                        # Entidades MikroORM
│   ├── default.entity.ts            # BaseEntity abstrata
│   ├── user.entity.ts               # Entidade de usuário
│   └── user-session.entity.ts       # Sessões de usuário (refresh tokens)
│
├── database/
│   ├── postgres-entity.repository.ts  # Repositório base
│   ├── migrations/                    # Migrations
│   └── seeders/                       # Seeders
│
├── middlewares/
│   └── auth.middleware.ts            # Middleware JWT
│
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt-auth.guard.ts
│   ├── jwt.strategy.ts
│   ├── empresa.guard.ts
│   ├── permissions.guard.ts
│   ├── roles.guard.ts
│   └── decorators/
│       ├── current-user.decorator.ts
│       ├── current-empresa.decorator.ts
│       └── current-cliente.decorator.ts
│   └── dto/
│       ├── login.dto.ts
│       ├── create-user.dto.ts
│       ├── auth-response.dto.ts
│       ├── user-response.dto.ts
│       └── refresh-token.dto.ts
│
├── common/
│   ├── encryption/
│   │   ├── encryption.module.ts
│   │   ├── encryption.service.ts
│   │   └── transformers/
│   ├── guards/
│   │   └── csrf.guard.ts
│   └── pipes/
│       └── sanitize.pipe.ts
│
├── decorators/
│   ├── permissions.decorator.ts
│   ├── roles.decorator.ts
│   └── public.decorator.ts
│
└── audit/
    ├── audit.module.ts
    └── audit.service.ts
```

## Autenticação e Tokens

O projeto implementa autenticação JWT com refresh tokens para segurança reforçada:

### Estratégia de Tokens

| Token         | Duração        | Formato               | Armazenamento                |
| ------------- | -------------- | --------------------- | ---------------------------- |
| access_token  | 15min (padrão) | JWT assinado          | Somente no cliente           |
| refresh_token | 30d (padrão)   | Opaco (hex 128 chars) | Hash SHA-256 em user_session |

### Fluxo de Autenticação

1. **Login** (`POST /auth/login`): Retorna `access_token` + `refresh_token` + `user`
2. **Refresh** (`POST /auth/refresh`): Recebe `refresh_token`, retorna novo par de tokens (rotação automática)
3. **Logout** (`POST /auth/logout`): Recebe `refresh_token`, revoga a sessão

### Endpoints de Autenticação

```
POST /auth/login       # Login (público)
POST /auth/refresh     # Renovar tokens (público)
POST /auth/logout     # Encerrar sessão (JwtAuthGuard)
POST /auth/register   # Criar usuário (JwtAuthGuard + RolesGuard)
GET  /auth/me         # Usuário atual (JwtAuthGuard)
```

### Guard Chain

O projeto usa uma cadeia de guards para proteção de rotas:

1. **AuthMiddleware** - Extrai e valida JWT das requisições
2. **CsrfGuard** - Proteção CSRF (global via APP_GUARD)
3. **JwtAuthGuard** - Valida token JWT
4. **RolesGuard/PermissionsGuard** - Controle de acesso granular

### Headers Necessários

```
Authorization: Bearer <access_token>
X-Requested-With: XMLHttpRequest  # Para POST/PUT/PATCH/DELETE
```

## Configuração de Ambiente

Crie o arquivo `.env` baseado no `.env.example`:

```bash
# Banco de dados
DATABASE_NAME=api_infinity_check
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432

# JWT
JWT_SECRET= # mínimo 32 caracteres
JWT_ACCESS_EXPIRES_IN=15m    # Padrão: 15 minutos
JWT_REFRESH_EXPIRES_IN=30d   # Padrão: 30 dias

# Criptografia
ENCRYPTION_KEY= # exatamente 64 caracteres hex

# App
PORT_NUMBER=3000
NODE_ENV=development
```

## Padrões de Código

### Criando uma Nova Entidade

```typescript
// src/entities/modulo/modulo.entity.ts
import { Entity, PrimaryKey, Property, Index } from "@mikro-orm/core";
import { DefaultEntity } from "../default.entity";

@Entity()
export class Modulo extends DefaultEntity {
  @PrimaryKey({ type: "uuid", defaultRaw: "gen_random_uuid()" })
  id!: string;

  @Index()
  @Property({ type: "uuid" })
  empresa_id!: string;

  @Property({ length: 100 })
  nome!: string;

  @Property({ nullable: true })
  deletadoEm?: Date;
}
```

### Criando um Novo Módulo

1. Criar a entidade em `src/entities/`
2. Registrar no MikroORM em `src/config/mikro-orm.config.ts`
3. Criar migration: `npm run migration:create`
4. Executar migration: `npm run migration:up`
5. Criar módulo, controller e service em `src/modulo/`
6. Importar no `AppModule`

### Criando Migration Manualmente

Quando o banco não está rodando, crie a migration manualmente em `src/database/migrations/`:

```typescript
import { Migration } from "@mikro-orm/migrations";

export class Migration20260303000000_create_modulo_table extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      create table "modulo" (
        "id" uuid not null default gen_random_uuid(),
        "empresa_id" uuid not null,
        "nome" varchar(100) not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "modulo_pkey" primary key ("id")
      );
    `);

    this.addSql(
      `create index "modulo_empresa_id_index" on "modulo" ("empresa_id");`,
    );
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "modulo" cascade;`);
  }
}
```

### Boas Práticas

1. **Sempre** filtre por `empresa_id` para multi-tenancy
2. Use **soft delete** ao invés de delete físico
3. Registre **auditoria** para operações críticas
4. **Nunca** exponha dados sensíveis em logs
5. Use **criptografia** para campos sensíveis
6. Valide **todos** os inputs com DTOs
7. Use **refresh tokens** para sessões longas

## Docker

### Desenvolvimento

```bash
# Iniciar serviços
docker compose up -d

# Parar serviços
docker compose down

# Ver logs
docker compose logs -f
```

### Produção

Use os arquivos `Dockerfile` e `docker-compose.yml` na raiz do projeto.

## Documentação da API

Acesse a documentação Swagger UI em: `http://localhost:3000/api`

## Variáveis de Ambiente Críticas

| Variável                 | Descrição                                         |
| ------------------------ | ------------------------------------------------- |
| `DATABASE_HOST`          | Host do PostgreSQL                                |
| `DATABASE_PORT`          | Porta do PostgreSQL                               |
| `DATABASE_USER`          | Usuário do PostgreSQL                             |
| `DATABASE_PASSWORD`      | Senha do PostgreSQL                               |
| `DATABASE_NAME`          | Nome do banco de dados                            |
| `JWT_SECRET`             | Chave secreta JWT (mínimo 32 caracteres)          |
| `JWT_ACCESS_EXPIRES_IN`  | Tempo de expiração do access token (padrão: 15m)  |
| `JWT_REFRESH_EXPIRES_IN` | Tempo de expiração do refresh token (padrão: 30d) |
| `ENCRYPTION_KEY`         | Chave de criptografia (64 caracteres hex)         |
| `PORT_NUMBER`            | Porta da aplicação                                |
| `NODE_ENV`               | Ambiente (development/production)                 |
