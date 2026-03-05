import { Migration } from '@mikro-orm/migrations';

export class Migration20260226000000_create_user_table extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      create table "user" (
        "id" uuid not null default gen_random_uuid(),
        "email" varchar(255) not null,
        "password" text not null,
        "nome" varchar(255) not null,
        "ativo" boolean not null default true,
        "empresa_id" varchar(255) not null,
        "cliente_id" varchar(255) null,
        "permissoes" jsonb null,
        "ultimo_login" timestamptz null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "user_pkey" primary key ("id")
      );
    `);

    this.addSql(`
      create unique index "user_email_unique" on "user" ("email");
    `);

    this.addSql(`
      create index "user_email_index" on "user" ("email");
    `);

    this.addSql(`
      create index "user_empresa_id_index" on "user" ("empresa_id");
    `);
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "user" cascade;`);
  }
}
