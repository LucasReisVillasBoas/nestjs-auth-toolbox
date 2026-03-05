import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'admin@example.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: '12345678',
    minLength: 6,
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password!: string;
}
