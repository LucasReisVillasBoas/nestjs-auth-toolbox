# Adicionando uma Nova Feature

Este guia passo a passo mostra como criar uma nova funcionalidade no padrão do projeto.

## 1. Criar a Entidade

Crie o arquivo em `src/entities/<feature>/<feature>.entity.ts`:

```typescript
import { Entity, PrimaryKey, Property, Index } from "@mikro-orm/core";
import { DefaultEntity } from "../default.entity";

@Entity({ tableName: "modulo" })
export class Modulo extends DefaultEntity {
  @PrimaryKey({ type: "uuid", defaultRaw: "gen_random_uuid()" })
  id!: string;

  @Index()
  @Property({ type: "uuid" })
  empresa_id!: string;

  @Property({ length: 100 })
  nome!: string;

  @Property({ nullable: true })
  descricao?: string;

  @Property({ default: true })
  ativo: boolean = true;

  @Property({ nullable: true })
  deletadoEm?: Date;
}
```

## 2. Registrar a Entidade

Edite `src/config/mikro-orm.config.ts` e adicione a nova entidade:

```typescript
import { Modulo } from '../entities/modulo/modulo.entity';

// No array entities:
entities: [User, UserSession, Modulo],
```

## 3. Criar a Migration

Execute o comando CLI:

```bash
npm run migration:create
```

Siga as instruções para nomear a migration. O arquivo será criado em `src/database/migrations/`.

Alternativamente, crie manualmente:

```typescript
import { Migration } from "@mikro-orm/migrations";

export class Migration20260303000000_create_modulo_table extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      create table "modulo" (
        "id" uuid not null default gen_random_uuid(),
        "empresa_id" uuid not null,
        "nome" varchar(100) not null,
        "descricao" text null,
        "ativo" boolean not null default true,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deletado_em" timestamptz null,
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

## 4. Criar o Módulo

Crie a estrutura em `src/<feature>/`:

```
src/modulo/
├── modulo.module.ts
├── modulo.controller.ts
├── modulo.service.ts
└── dto/
    ├── create-modulo.dto.ts
    └── update-modulo.dto.ts
```

### modulo.module.ts

```typescript
import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Modulo } from "../entities/modulo/modulo.entity";
import { ModuloController } from "./modulo.controller";
import { ModuloService } from "./modulo.service";

@Module({
  imports: [MikroOrmModule.forFeature([Modulo])],
  controllers: [ModuloController],
  providers: [ModuloService],
  exports: [ModuloService],
})
export class ModuloModule {}
```

### modulo.service.ts

```typescript
import { Injectable, NotFoundException } from "@nestjs/common";
import { EntityManager } from "@mikro-orm/core";
import { Modulo } from "../entities/modulo/modulo.entity";
import { CreateModuloDto } from "./dto/create-modulo.dto";
import { UpdateModuloDto } from "./dto/update-modulo.dto";

@Injectable()
export class ModuloService {
  constructor(private readonly em: EntityManager) {}

  async create(dto: CreateModuloDto, empresaId: string): Promise<Modulo> {
    const modulo = this.em.create(Modulo, {
      ...dto,
      empresa_id: empresaId,
    });
    await this.em.persistAndFlush(modulo);
    return modulo;
  }

  async findAll(empresaId: string): Promise<Modulo[]> {
    return this.em.find(Modulo, {
      empresa_id: empresaId,
      deletadoEm: null,
    });
  }

  async findOne(id: string, empresaId: string): Promise<Modulo> {
    const modulo = await this.em.findOne(Modulo, {
      id,
      empresa_id: empresaId,
      deletadoEm: null,
    });
    if (!modulo) {
      throw new NotFoundException("Módulo não encontrado");
    }
    return modulo;
  }

  async update(
    id: string,
    dto: UpdateModuloDto,
    empresaId: string,
  ): Promise<Modulo> {
    const modulo = await this.findOne(id, empresaId);
    Object.assign(modulo, dto);
    await this.em.flush();
    return modulo;
  }

  async remove(id: string, empresaId: string): Promise<void> {
    const modulo = await this.findOne(id, empresaId);
    modulo.deletadoEm = new Date();
    await this.em.flush();
  }
}
```

### modulo.controller.ts

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ModuloService } from "./modulo.service";
import { CreateModuloDto } from "./dto/create-modulo.dto";
import { UpdateModuloDto } from "./dto/update-modulo.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentEmpresa } from "../auth/decorators/current-empresa.decorator";

@ApiTags("Módulos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("modulos")
export class ModuloController {
  constructor(private readonly moduloService: ModuloService) {}

  @Post()
  create(@Body() dto: CreateModuloDto, @CurrentEmpresa() empresaId: string) {
    return this.moduloService.create(dto, empresaId);
  }

  @Get()
  findAll(@CurrentEmpresa() empresaId: string) {
    return this.moduloService.findAll(empresaId);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentEmpresa() empresaId: string) {
    return this.moduloService.findOne(id, empresaId);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateModuloDto,
    @CurrentEmpresa() empresaId: string,
  ) {
    return this.moduloService.update(id, dto, empresaId);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentEmpresa() empresaId: string) {
    return this.moduloService.remove(id, empresaId);
  }
}
```

### DTOs

```typescript
// dto/create-modulo.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateModuloDto {
  @ApiProperty({ example: "Financeiro" })
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty({ example: "Módulo de controle financeiro", required: false })
  @IsString()
  @IsOptional()
  descricao?: string;
}
```

## 5. Importar no AppModule

Edite `src/app.module.ts`:

```typescript
import { ModuloModule } from "./modulo/modulo.module";

@Module({
  imports: [
    // ... outros módulos
    ModuloModule,
  ],
})
export class AppModule {}
```

## 6. Executar a Migration

```bash
npm run migration:up
```

## 7. Proteger Rotas com Guards

O projeto oferece vários guards para proteção:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from '../decorators/roles.decorator';

// Proteger com JWT
@UseGuards(JwtAuthGuard)
@Get()
findAll() { }

// Proteger com Roles
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Post()
create() { }
```

## 8. Executar Seeders (opcional)

```bash
npm run seeder:run
```
