import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Verificar se a rota tem o decorator @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (err?.name === "TokenExpiredError") {
        throw new UnauthorizedException("Token expirado");
      }
      if (err?.name === "JsonWebTokenError") {
        throw new UnauthorizedException("Token inválido");
      }
      throw err || new UnauthorizedException("Token inválido ou expirado");
    }
    return user;
  }
}
