import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class RefreshTokenDto {
  @ApiProperty({
    description: "Refresh token opaco",
    example: "a1b2c3d4e5f6...",
  })
  @IsString({ message: "Refresh token deve ser uma string" })
  @IsNotEmpty({ message: "Refresh token é obrigatório" })
  refresh_token!: string;
}
