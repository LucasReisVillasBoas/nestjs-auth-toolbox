import { ApiProperty } from "@nestjs/swagger";
import { UserResponseDto } from "./user-response.dto";

export class AuthResponseDto {
  @ApiProperty({
    description: "Token JWT para autenticação",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  access_token!: string;

  @ApiProperty({
    description: "Refresh token opaco para renovação de sessão",
    example: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2...",
  })
  refresh_token!: string;

  @ApiProperty({
    description: "Dados do usuário autenticado",
    type: UserResponseDto,
  })
  user!: UserResponseDto;

  constructor(
    access_token: string,
    refresh_token: string,
    user: UserResponseDto,
  ) {
    this.access_token = access_token;
    this.refresh_token = refresh_token;
    this.user = user;
  }
}
