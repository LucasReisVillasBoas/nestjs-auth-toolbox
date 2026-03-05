import { defineConfig } from "@mikro-orm/postgresql";
import {
  DATABASE_NAME,
  DATABASE_PASSWORD,
  DATABASE_USER,
  DATABASE_HOST,
  DATABASE_PORT,
} from "../settings";
import { User } from "../entities/user.entity";
import { UserSession } from "../entities/user-session.entity";

export default defineConfig({
  host: DATABASE_HOST,
  port: parseInt(DATABASE_PORT, 10),
  dbName: DATABASE_NAME,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,

  // Registre aqui TODAS as entidades da aplicação
  entities: [User, UserSession],

  // Permite rodar sem entidades no início do projeto
  discovery: {
    warnWhenNoEntities: false,
  },

  migrations: {
    // Em produção (após `npm run build`), as migrations são compiladas para dist/.
    // Em desenvolvimento, o CLI usa ts-node e aponta para o código TypeScript.
    path:
      process.env.NODE_ENV === "production"
        ? "dist/database/migrations"
        : "src/database/migrations",
  },

  seeder: {
    path:
      process.env.NODE_ENV === "production"
        ? "dist/database/seeders"
        : "src/database/seeders",
  },

  // Configurações adicionais recomendadas
  debug: process.env.NODE_ENV === "development",
  allowGlobalContext: true, // Permite usar EntityManager fora do RequestContext em algumas situações
});
