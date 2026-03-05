import { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";
import { AdminUserSeeder } from "./AdminUserSeeder";

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.call(em, [AdminUserSeeder]);
  }
}
