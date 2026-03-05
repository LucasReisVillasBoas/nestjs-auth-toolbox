import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      let authHeader = req.headers.authorization;

      // DEBUG: aceitar token via query param para facilitar teste
      if (!authHeader && req.query["token"]) {
        const tokenFromQuery = req.query["token"] as string;
        authHeader = `Bearer ${tokenFromQuery}`;
      }

      if (!authHeader?.startsWith("Bearer ")) {
        throw new UnauthorizedException("Token não fornecido");
      }

      const token = authHeader.split(" ")[1];
      const payload = await this.jwtService.verifyAsync(token);

      req["user"] = {
        id: payload.sub,
        email: payload.email,
        empresa_id: payload.empresa_id,
        cliente_id: payload.cliente_id,
        permissoes: payload.permissoes ?? {},
        method: req.method,
        path: req.path,
      };

      next();
    } catch (error) {
      const jwtErrors = [
        "TokenExpiredError",
        "JsonWebTokenError",
        "NotBeforeError",
      ];
      if (
        error instanceof UnauthorizedException ||
        jwtErrors.includes(error?.name)
      ) {
        const message =
          error?.name === "TokenExpiredError"
            ? "Token expirado"
            : error instanceof UnauthorizedException
              ? error.message
              : "Token inválido";
        res.status(401).json({
          message,
          error: "Unauthorized",
          statusCode: 401,
        });
      } else {
        next(error);
      }
    }
  }
}
