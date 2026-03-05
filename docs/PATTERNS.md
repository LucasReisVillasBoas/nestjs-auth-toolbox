# Padrões do Projeto

Referência de padrões e convenções do projeto com exemplos de código.

## Multi-tenancy

Todas as operações no banco de dados DEVEM ser filtradas por `empresa_id`:

```typescript
// ✅ Correto - sempre filtre por empresa_id
async findAll(empresaId: string): Promise<Modulo[]> {
  return this.em.find(Modulo, {
    empresa_id: empresaId,
    deletadoEm: null,
  });
}

// ❌ Incorreto - sem filtro de empresa (viola multi-tenancy)
async findAll(): Promise<Modulo[]> {
  return this.em.find(Modulo, {});
}
```

Use o decorator `@CurrentEmpresa()` para obter o empresa_id do token:

```typescript
@Get()
findAll(@CurrentEmpresa() empresaId: string) {
  return this.moduloService.findAll(empresaId);
}
```

## Permissões e Guards

### Decorator @Roles()

Use para verificar se o usuário tem uma role específica:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'gestor')
@Post()
create() { }
```

### Decorator @RequirePermissions()

Use para permissões granulares (se implementado):

```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('modulos', 'criar')
@Post()
create() { }
```

### Guard Chain

O projeto usa uma cadeia de guards:

1. **AuthMiddleware** - Extrai e valida JWT das requisições
2. **CsrfGuard** - Proteção CSRF (global via APP_GUARD)
3. **JwtAuthGuard** - Valida token JWT
4. **RolesGuard/PermissionsGuard** - Controle de acesso granular

## Soft Delete

Use o campo `deletadoEm` em vez de excluir fisicamente:

```typescript
// ✅ Correto - soft delete
async remove(id: string, empresaId: string): Promise<void> {
  const modulo = await this.findOne(id, empresaId);
  modulo.deletadoEm = new Date();
  await this.em.flush();
}

// ❌ Incorreto - delete físico
async remove(id: string): Promise<void> {
  await this.em.removeAndFlush(modulo);
}
```

Sempre filtre por `deletadoEm: null`:

```typescript
const items = await this.em.find(Modulo, {
  empresa_id: empresaId,
  deletadoEm: null, // Não retorna itens deletados
});
```

## Criptografia

Para campos sensíveis, use o transformer `@EncryptedString()`:

```typescript
import { EncryptedString } from "../common/encryption/transformers/encrypted-string.transformer";

@Entity()
export class Cliente extends DefaultEntity {
  @Property()
  nome!: string;

  @Property({ columnType: "text" })
  @EncryptedString()
  cpf!: string;

  @Property({ columnType: "text" })
  @EncryptedString()
  telefone!: string;
}
```

## Auditoria

Para registrar operações críticas, use o `AuditService`:

```typescript
import {
  AuditService,
  AuditEventType,
  AuditSeverity,
} from "../audit/audit.service";

@Injectable()
export class ModuloService {
  constructor(
    private readonly em: EntityManager,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateModuloDto, user: any): Promise<Modulo> {
    const modulo = this.em.create(Modulo, {
      ...dto,
      empresa_id: user.empresa_id,
    });
    await this.em.persistAndFlush(modulo);

    await this.auditService.log({
      timestamp: new Date(),
      eventType: AuditEventType.ENTITY_CREATED,
      severity: AuditSeverity.INFO,
      userId: user.id,
      userEmail: user.email,
      empresaId: user.empresa_id,
      success: true,
      details: { entityId: modulo.id, entityType: "Modulo" },
    });

    return modulo;
  }
}
```

Eventos disponíveis:

- `AuditEventType.USER_LOGIN`
- `AuditEventType.USER_LOGOUT`
- `AuditEventType.USER_CREATED`
- `AuditEventType.ENTITY_CREATED`
- `AuditEventType.ENTITY_UPDATED`
- `AuditEventType.ENTITY_DELETED`
- `AuditEventType.PERMISSION_DENIED`
- `AuditEventType.SYSTEM_ERROR`

## Repository Pattern

### Usando Repository Customizado

Crie um repositório para lógica de negócio reutilizável:

```typescript
// src/entities/user/user.repository.ts
import { EntityRepository, EntityManager } from "@mikro-orm/core";
import { User } from "./user.entity";

@EntityRepository(User)
export class UserRepository extends EntityRepository<User> {
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email: email.toLowerCase() });
  }

  async findActiveByEmpresa(empresaId: string): Promise<User[]> {
    return this.find({
      empresa_id: empresaId,
      ativo: true,
      deletadoEm: null,
    });
  }
}
```

### Usando EntityManager

Para operações mais complexas, use o `EntityManager`:

```typescript
@Injectable()
export class ReportService {
  constructor(private readonly em: EntityManager) {}

  async generateReport(empresaId: string, startDate: Date, endDate: Date) {
    const items = await this.em.find(
      Item,
      {
        empresa_id: empresaId,
        createdAt: { $gte: startDate, $lte: endDate },
      },
      { populate: ["categoria"] },
    );
    return items;
  }
}
```

## DTOs e Validação

Sempre use DTOs com class-validator:

```typescript
import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from "class-validator";

export class CreateItemDto {
  @ApiProperty({ example: "Item de exemplo" })
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty({ example: 100, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(999999)
  quantidade?: number;

  @ApiProperty({ example: "observaçoes...", required: false })
  @IsString()
  @IsOptional()
  observacoes?: string;
}
```

Use `class-transformer` para sanitização:

```typescript
import { Transform } from 'class-transformer';

// Remove espaços em branco extras
@Transform(({ value }) => value?.trim())

// Converte para minúsculas
@Transform(({ value }) => value?.toLowerCase())
```

## Headers Necessários

```
Authorization: Bearer <access_token>
X-Requested-With: XMLHttpRequest  # Para POST/PUT/PATCH/DELETE
```

## Status Codes

| Código | Uso                                      |
| ------ | ---------------------------------------- |
| 200    | Operações bem-sucedidas (GET, PUT)       |
| 201    | Recurso criado com sucesso (POST)        |
| 400    | Erro de validação (DTO inválido)         |
| 401    | Não autenticado                          |
| 403    | Autenticado mas sem permissão            |
| 404    | Recurso não encontrado                   |
| 409    | Conflito (ex: email já existe)           |
| 422    | Erro de negócio (ex: saldo insuficiente) |
| 500    | Erro interno do servidor                 |

## Naming Conventions

- **Entidades**: PascalCase (`User`, `UserSession`)
- **Tabelas**: snake_case (`user`, `user_session`)
- **Campos**: snake_case (`empresa_id`, `deletado_em`)
- **Controllers**: PascalCase com sufixo `Controller`
- **Services**: PascalCase com sufixo `Service`
- **DTOs**: PascalCase com sufixo `Dto`
