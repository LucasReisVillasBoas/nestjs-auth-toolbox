import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { randomUUID } from "crypto";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext("HTTP");
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const { method, url } = req;
    const requestId = randomUUID();
    const start = Date.now();

    req["requestId"] = requestId;
    res.setHeader("X-Request-Id", requestId);

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        const userId = req["user"]?.id ?? "anonymous";
        this.logger.info(
          { method, url, statusCode: res.statusCode, ms, userId, requestId },
          `${method} ${url} ${res.statusCode} ${ms}ms`,
        );
      }),
      catchError((err) => {
        const ms = Date.now() - start;
        const userId = req["user"]?.id ?? "anonymous";
        this.logger.error(
          {
            method,
            url,
            statusCode: err.status ?? 500,
            ms,
            userId,
            requestId,
            error: err.message,
          },
          `${method} ${url} ${err.status ?? 500} ${ms}ms`,
        );
        throw err;
      }),
    );
  }
}
