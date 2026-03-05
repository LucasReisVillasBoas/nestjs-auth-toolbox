import { Body, Controller, Post, Get, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import {
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from "@nestjs/swagger";

import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { SkipCsrfCheck } from "../common/guards/csrf.guard";
import { RolesGuard } from "./roles.guard";
import { Roles } from "../decorators/roles.decorator";

@Controller("auth")
@ApiTags("Auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login
   */
  @ApiOperation({ summary: "Login de usuário" })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
  })
  @SkipCsrfCheck()
  @Post("login")
  async login(
    @Req() req: Request,
    @Body() loginDto: LoginDto,
  ): Promise<AuthResponseDto> {
    const ip =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

    const userAgent = req.headers["user-agent"];

    return this.authService.login(loginDto, ip, userAgent);
  }

  /**
   * Refresh token - renova o par de tokens
   */
  @ApiOperation({ summary: "Renovar tokens de autenticação" })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Refresh token inválido ou expirado",
  })
  @SkipCsrfCheck()
  @Post("refresh")
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    const ip =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

    const userAgent = req.headers["user-agent"];

    return this.authService.refresh(dto, ip, userAgent);
  }

  /**
   * Registrar novo usuário (ideal proteger depois com RoleGuard)
   */
  @ApiOperation({ summary: "Criar novo usuário (somente admin)" })
  @ApiBearerAuth("access-token")
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 401, description: "Não autenticado" })
  @ApiResponse({ status: 403, description: "Sem permissão de admin" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("usuarios")
  @Post("register")
  async register(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: any,
  ): Promise<UserResponseDto> {
    return this.authService.register(createUserDto, user.id);
  }

  /**
   * Retorna usuário autenticado
   */
  @ApiOperation({ summary: "Buscar usuário atual" })
  @ApiBearerAuth("access-token")
  @ApiResponse({
    status: 200,
    type: UserResponseDto,
  })
  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getCurrentUser(@CurrentUser() user: any): Promise<UserResponseDto> {
    return this.authService.getCurrentUser(user.id);
  }
}
