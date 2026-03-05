import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { JwtModule } from "@nestjs/jwt";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";

import mikroOrmConfig from "./config/mikro-orm.config";
import configuration from "./config/configuration";
import { validateEnv } from "./config/env.validation";

import { AuthMiddleware } from "./middlewares/auth.middleware";
import { CsrfGuard } from "./common/guards/csrf.guard";
import { EncryptionModule } from "./common/encryption/encryption.module";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    // Configuração global — disponível em toda a aplicação via ConfigService
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // MikroORM
    MikroOrmModule.forRoot(mikroOrmConfig),

    // JWT global — disponível sem reimportar nos módulos
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>("jwt.secret") || process.env.JWT_SECRET,
        signOptions: {
          expiresIn: configService.get<string>("jwt.accessExpiresIn") || "15m",
        },
      }),
    }),

    // Logger estruturado (Pino)
    LoggerModule.forRootAsync({
      useFactory: () => {
        const isDev = process.env.NODE_ENV !== "production";
        return {
          pinoHttp: {
            level: isDev ? "debug" : "info",
            redact: {
              paths: [
                "req.headers.authorization",
                "body.password",
                "body.refresh_token",
              ],
              censor: "[Redacted]",
            },
            transport: isDev
              ? {
                  target: "pino-pretty",
                  options: {
                    colorize: true,
                    translateTime: "HH:MM:ss",
                    ignore: "pid,hostname,req,res",
                    messageFormat:
                      "{levelLabel} [{context}] {msg}",
                  },
                }
              : undefined,
            autoLogging: false, // logging feito pelo LoggingInterceptor
          },
        };
      },
    }),

    // Módulos da aplicação
    EncryptionModule,
    AuditModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // CSRF como guard global
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    // Logging de todas as requisições HTTP
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      // Rotas públicas que não precisam de JWT
      .exclude(
        { path: "/", method: RequestMethod.ALL },
        { path: "health", method: RequestMethod.ALL },
        { path: "auth/login", method: RequestMethod.POST },
        { path: "auth/register", method: RequestMethod.POST },
        { path: "auth/refresh", method: RequestMethod.POST },
      )
      .forRoutes("*");
  }
}
