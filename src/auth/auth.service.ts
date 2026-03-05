import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { EntityManager } from "@mikro-orm/core";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

import { User } from "../entities/user.entity";
import { UserSession } from "../entities/user-session.entity";
import {
  AuditService,
  AuditEventType,
  AuditSeverity,
} from "../audit/audit.service";
import { LoginDto } from "./dto/login.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  constructor(
    private readonly em: EntityManager,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.em.findOne(User, { email: email.toLowerCase() });

    if (!user) {
      return null;
    }

    if (!user.ativo) {
      return null;
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _ignored, ...userWithoutPassword } = user as any;
    return userWithoutPassword as User;
  }

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString("hex");
  }

  private async createSession(
    user: User,
    refreshToken: string,
    ip?: string,
    userAgent?: string,
  ): Promise<UserSession> {
    const refreshExpiresIn =
      this.configService.get<string>("jwt.refreshExpiresIn") || "30d";
    const expiresAt = this.calculateExpiry(refreshExpiresIn);

    const session = this.em.create(UserSession, {
      user,
      token_hash: this.hashToken(refreshToken),
      ip,
      user_agent: userAgent,
      expires_at: expiresAt,
    });

    await this.em.persistAndFlush(session);
    return session;
  }

  private calculateExpiry(expiresIn: string): Date {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s":
        return new Date(now.getTime() + value * 1000);
      case "m":
        return new Date(now.getTime() + value * 60 * 1000);
      case "h":
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case "d":
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  async login(
    loginDto: LoginDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.validateUser(email, password);

    if (!user) {
      await this.auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.USER_LOGIN,
        severity: AuditSeverity.WARNING,
        userEmail: email,
        ip,
        userAgent,
        success: false,
        errorMessage: "Credenciais inválidas",
      });

      throw new UnauthorizedException("Credenciais inválidas");
    }

    user.ultimo_login = new Date();
    await this.em.flush();

    const refreshToken = this.generateRefreshToken();
    await this.createSession(user, refreshToken, ip, userAgent);

    const payload = {
      sub: user.id,
      email: user.email,
      empresa_id: user.empresa_id,
      cliente_id: user.cliente_id,
      permissoes: user.permissoes ?? {},
    };

    const accessExpiresIn =
      this.configService.get<string>("jwt.accessExpiresIn") || "15m";
    const access_token = this.jwtService.sign(payload, {
      expiresIn: accessExpiresIn,
    });

    await this.auditService.log({
      timestamp: new Date(),
      eventType: AuditEventType.USER_LOGIN,
      severity: AuditSeverity.INFO,
      userId: user.id,
      userEmail: user.email,
      empresaId: user.empresa_id,
      ip,
      userAgent,
      success: true,
    });

    return new AuthResponseDto(
      access_token,
      refreshToken,
      UserResponseDto.fromEntity(user),
    );
  }

  async refresh(
    dto: RefreshTokenDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const tokenHash = this.hashToken(dto.refresh_token);

    const session = await this.em.findOne(
      UserSession,
      { token_hash: tokenHash },
      { populate: ["user"] as any },
    );

    if (!session) {
      throw new UnauthorizedException("Refresh token inválido");
    }

    if (session.revoked_at) {
      throw new UnauthorizedException("Refresh token foi revogado");
    }

    if (new Date() > session.expires_at) {
      throw new UnauthorizedException("Refresh token expirado");
    }

    const user = session.user;
    if (!user.ativo) {
      throw new UnauthorizedException("Usuário inativo");
    }

    session.revoked_at = new Date();

    const newRefreshToken = this.generateRefreshToken();
    const newSession = await this.createSession(
      user,
      newRefreshToken,
      ip,
      userAgent,
    );

    const payload = {
      sub: user.id,
      email: user.email,
      empresa_id: user.empresa_id,
      cliente_id: user.cliente_id,
      permissoes: user.permissoes ?? {},
    };

    const accessExpiresIn =
      this.configService.get<string>("jwt.accessExpiresIn") || "15m";
    const access_token = this.jwtService.sign(payload, {
      expiresIn: accessExpiresIn,
    });

    await this.em.flush();

    return new AuthResponseDto(
      access_token,
      newRefreshToken,
      UserResponseDto.fromEntity(user),
    );
  }

  async register(
    createUserDto: CreateUserDto,
    createdBy?: string,
  ): Promise<UserResponseDto> {
    const { email, password, ...userData } = createUserDto;

    const existingUser = await this.em.findOne(User, {
      email: email.toLowerCase(),
    });

    if (existingUser) {
      throw new ConflictException("Email já cadastrado");
    }

    const hashedPassword = await this.hashPassword(password);

    const user = this.em.create(User, {
      email: email.toLowerCase(),
      password: hashedPassword,
      ...userData,
    });

    await this.em.persistAndFlush(user);

    await this.auditService.log({
      timestamp: new Date(),
      eventType: AuditEventType.USER_CREATED,
      severity: AuditSeverity.INFO,
      userId: createdBy,
      empresaId: user.empresa_id,
      success: true,
      details: {
        newUserId: user.id,
        newUserEmail: user.email,
      },
    });

    return UserResponseDto.fromEntity(user);
  }

  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await this.em.findOne(User, { id: userId });

    if (!user) {
      throw new UnauthorizedException("Usuário não encontrado");
    }

    const { password: _ignored, ...userWithoutPassword } = user as any;
    return UserResponseDto.fromEntity(userWithoutPassword as User);
  }
}
