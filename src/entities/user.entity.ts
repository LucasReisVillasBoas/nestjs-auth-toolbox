import { Entity, PrimaryKey, Property, Index } from "@mikro-orm/core";
import { ApiProperty, ApiHideProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { DefaultEntity } from "./default.entity";
import { UserRepository } from "./user.repository";

export { UserRepository };

@Entity({ tableName: "user", repository: () => UserRepository })
export class User extends DefaultEntity {
  @ApiProperty({ description: "ID único do usuário", example: "uuid-v4" })
  @PrimaryKey({ type: "uuid", defaultRaw: "gen_random_uuid()" })
  id!: string;

  @ApiProperty({
    description: "Email do usuário",
    example: "usuario@example.com",
  })
  @Property({ unique: true, length: 255 })
  @Index()
  email!: string;

  @ApiHideProperty()
  @Exclude()
  @Property({ hidden: true })
  password!: string;

  @ApiProperty({
    description: "Nome completo do usuário",
    example: "João Silva",
  })
  @Property({ length: 255 })
  nome!: string;

  @ApiProperty({ description: "Status ativo do usuário", example: true })
  @Property({ default: true })
  ativo: boolean = true;

  @ApiProperty({
    description: "ID da empresa (tenant)",
    example: "empresa-001",
  })
  @Property({ length: 255 })
  @Index()
  empresa_id!: string;

  @ApiProperty({
    description: "ID do cliente (segmentação opcional)",
    example: "cliente-001",
    required: false,
  })
  @Property({ nullable: true, length: 255 })
  cliente_id?: string;

  @ApiProperty({
    description: "Permissões do usuário em formato JSONB",
    example: { usuarios: ["listar", "criar"] },
    required: false,
  })
  @Property({ type: "json", nullable: true })
  permissoes?: Record<string, string[]>;

  @ApiProperty({
    description: "Data e hora do último login",
    example: "2026-02-26T18:00:00.000Z",
    required: false,
  })
  @Property({ nullable: true })
  ultimo_login?: Date;
}
