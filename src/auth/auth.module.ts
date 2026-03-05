import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { JwtStrategy } from "./jwt.strategy";
import { AuthService } from "./auth.service";
import { User } from "../entities/user.entity";
import { UserSession } from "../entities/user-session.entity";
import { AuditModule } from "../audit/audit.module";
import { AuthController } from "./auth.controller";

@Module({
  imports: [
    PassportModule,
    MikroOrmModule.forFeature([User, UserSession]),
    AuditModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService],
  exports: [PassportModule, AuthService],
})
export class AuthModule {}
