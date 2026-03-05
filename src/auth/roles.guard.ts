import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

/**
 * Guard de roles baseado em permissoes.
 * @Roles('usuarios') — exige que user.permissoes tenha a chave 'usuarios'
 * com pelo menos uma ação associada.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>("roles", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("Usuário não autenticado");
    }

    const permissoes: Record<string, string[]> = user.permissoes ?? {};

    // Verifica se o usuário possui ao menos um dos módulos (roles) exigidos
    const hasRole = requiredRoles.some(
      (role) => Array.isArray(permissoes[role]) && permissoes[role].length > 0,
    );

    if (!hasRole) {
      throw new ForbiddenException(
        "Você não tem permissão para acessar este recurso",
      );
    }

    return true;
  }
}
