import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { User } from '../../entities/user.entity';

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty({ description: 'ID do usuário' })
  id!: string;

  @Expose()
  @ApiProperty({ description: 'Email do usuário' })
  email!: string;

  @Expose()
  @ApiProperty({ description: 'Nome completo do usuário' })
  nome!: string;

  @Expose()
  @ApiProperty({ description: 'Status ativo do usuário' })
  ativo!: boolean;

  @Expose()
  @ApiProperty({ description: 'ID da empresa (tenant)' })
  empresa_id!: string;

  @Expose()
  @ApiProperty({ description: 'ID do cliente', required: false })
  cliente_id?: string;

  @Expose()
  @ApiProperty({ description: 'Permissões do usuário', required: false })
  permissoes?: Record<string, string[]>;

  @Expose()
  @ApiProperty({ description: 'Data do último login', required: false })
  ultimo_login?: Date;

  @Expose()
  @ApiProperty({ description: 'Data de criação' })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ description: 'Data de atualização' })
  updatedAt!: Date;

  constructor(user: Partial<User>) {
    Object.assign(this, user);
  }

  static fromEntity(user: User): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      email: user.email,
      nome: user.nome,
      ativo: user.ativo,
      empresa_id: user.empresa_id,
      cliente_id: user.cliente_id,
      permissoes: user.permissoes,
      ultimo_login: user.ultimo_login,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
