import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsOptional,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'novo.usuario@example.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'SenhaForte123!',
    minLength: 8,
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Senha deve conter letras maiúsculas, minúsculas e números',
  })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password!: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João da Silva',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome!: string;

  @ApiProperty({
    description: 'ID da empresa (tenant)',
    example: 'empresa-001',
  })
  @IsString({ message: 'ID da empresa deve ser uma string' })
  @IsNotEmpty({ message: 'ID da empresa é obrigatório' })
  empresa_id!: string;

  @ApiProperty({
    description: 'ID do cliente (segmentação opcional)',
    example: 'cliente-001',
    required: false,
  })
  @IsString({ message: 'ID do cliente deve ser uma string' })
  @IsOptional()
  cliente_id?: string;

  @ApiProperty({
    description: 'Permissões do usuário em formato JSON',
    example: { usuarios: ['listar', 'criar'] },
    required: false,
  })
  @IsObject({ message: 'Permissões devem ser um objeto' })
  @IsOptional()
  permissoes?: Record<string, string[]>;
}
