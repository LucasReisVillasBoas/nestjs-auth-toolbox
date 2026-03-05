import { Injectable, Logger } from "@nestjs/common";

export enum AuditEventType {
  USER_LOGIN = "USER_LOGIN",
  USER_LOGOUT = "USER_LOGOUT",
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  ENTITY_CREATED = "ENTITY_CREATED",
  ENTITY_UPDATED = "ENTITY_UPDATED",
  ENTITY_DELETED = "ENTITY_DELETED",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  SYSTEM_ERROR = "SYSTEM_ERROR",
}

export enum AuditSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

export interface AuditLogData {
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  userEmail?: string;
  empresaId?: string;
  ip?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  success: boolean;
  details?: any;
  errorMessage?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  async log(data: AuditLogData): Promise<void> {
    try {
      const msg = `[AUDIT] ${data.eventType} | success=${data.success}${data.userEmail ? ` | user=${data.userEmail}` : ""}${data.empresaId ? ` | empresa=${data.empresaId}` : ""}${data.errorMessage ? ` | error=${data.errorMessage}` : ""}`;

      if (
        data.severity === AuditSeverity.ERROR ||
        data.severity === AuditSeverity.CRITICAL
      ) {
        this.logger.error({ ...data, timestamp: data.timestamp.toISOString() }, msg);
      } else if (data.severity === AuditSeverity.WARNING) {
        this.logger.warn(msg);
      } else {
        this.logger.log(msg);
      }
    } catch (error) {
      // Nunca deixar falha de auditoria quebrar a aplicação
      this.logger.error(`Erro ao registrar auditoria: ${error}`);
    }
  }

  async logUserAction(
    userId: string,
    userEmail: string,
    eventType: AuditEventType,
    details?: any,
  ): Promise<void> {
    await this.log({
      timestamp: new Date(),
      eventType,
      severity: AuditSeverity.INFO,
      userId,
      userEmail,
      success: true,
      details,
    });
  }

  async logEntityChange(
    entityName: string,
    entityId: string,
    action: "create" | "update" | "delete",
    userId: string,
    userEmail: string,
    empresaId: string,
    details?: any,
  ): Promise<void> {
    const eventTypeMap = {
      create: AuditEventType.ENTITY_CREATED,
      update: AuditEventType.ENTITY_UPDATED,
      delete: AuditEventType.ENTITY_DELETED,
    };

    await this.log({
      timestamp: new Date(),
      eventType: eventTypeMap[action],
      severity: AuditSeverity.INFO,
      userId,
      userEmail,
      empresaId,
      resource: entityName,
      action,
      success: true,
      details: { entityId, ...details },
    });
  }

  async logError(
    error: Error,
    userId?: string,
    userEmail?: string,
    context?: string,
  ): Promise<void> {
    await this.log({
      timestamp: new Date(),
      eventType: AuditEventType.SYSTEM_ERROR,
      severity: AuditSeverity.ERROR,
      userId,
      userEmail,
      success: false,
      errorMessage: error.message,
      details: { context, stack: error.stack },
    });
  }
}
