import { PostgresEntityRepository } from "../database/postgres-entity.repository";
import { User } from "./user.entity";

export class UserRepository extends PostgresEntityRepository<User> {
  /**
   * Busca usuário por email (sem incluir password)
   * @param email - Email do usuário (será convertido para lowercase)
   * @returns User sem password ou null
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne(
      { email: email.toLowerCase() },
      { fields: ["*", "!password"] as any }, // Exclui password (sintaxe MikroORM runtime)
    );
  }

  /**
   * Busca usuário por email COM password (apenas para validação de login)
   * @param email - Email do usuário (será convertido para lowercase)
   * @returns User com password ou null
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.findOne({ email: email.toLowerCase() });
  }

  /**
   * Busca usuários ativos de uma empresa
   * @param empresaId - ID da empresa
   * @returns Array de usuários ativos (sem password)
   */
  async findActiveByEmpresa(empresaId: string): Promise<User[]> {
    return this.find(
      { empresa_id: empresaId, ativo: true },
      {
        fields: ["*", "!password"] as any,
        orderBy: { createdAt: "DESC" },
      },
    );
  }

  /**
   * Busca usuário por ID (sem password)
   * @param id - ID do usuário
   * @returns User sem password ou null
   */
  async findByIdSafe(id: string): Promise<User | null> {
    return this.findOne({ id }, { fields: ["*", "!password"] as any });
  }
}
