import { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";
import * as bcrypt from "bcryptjs";
import { User } from "../../entities/user.entity";

/**
 * Seeder para criação do usuário administrador inicial.
 * Execute com: npm run seeder:run
 *
 * Credenciais padrão (altere após o primeiro login):
 *   email:    admin@infinity.com
 *   senha:    12345678
 */
export class AdminUserSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const email = "admin@infinity.com";

    const existing = await em.findOne(User, { email });
    if (existing) {
      console.log(`[Seeder] Usuário admin já existe (${email}). Pulando.`);
      return;
    }

    const hashedPassword = await bcrypt.hash("12345678", 10);

    const admin = em.create(User, {
      email,
      password: hashedPassword,
      nome: "Administrador",
      ativo: true,
      empresa_id: "empresa-admin",
      permissoes: {
        usuarios: ["listar", "criar", "editar", "deletar", "visualizar"],
        empresa: ["listar", "criar", "editar", "deletar", "visualizar"],
      },
    });

    await em.persistAndFlush(admin);

    console.log("[Seeder] Usuário admin criado com sucesso!");
    console.log(`  Email:  ${email}`);
    console.log("  Senha:  12345678");
    console.log("  IMPORTANTE: Altere a senha após o primeiro login.");
  }
}
