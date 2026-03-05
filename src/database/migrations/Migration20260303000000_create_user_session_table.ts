import { Migration } from "@mikro-orm/migrations";

export class Migration20260303000000_create_user_session_table extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      create table "user_session" (
        "id" uuid not null default gen_random_uuid(),
        "user_id" uuid not null,
        "token_hash" varchar(128) not null,
        "ip" varchar(255) null,
        "user_agent" varchar(512) null,
        "expires_at" timestamptz not null,
        "revoked_at" timestamptz null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "user_session_pkey" primary key ("id")
      );
    `);

    this.addSql(`
      create unique index "user_session_token_hash_unique" on "user_session" ("token_hash");
    `);

    this.addSql(`
      create index "user_session_user_id_index" on "user_session" ("user_id");
    `);

    this.addSql(`
      create index "user_session_expires_at_index" on "user_session" ("expires_at");
    `);

    this.addSql(`
      alter table "user_session" add constraint "user_session_user_id_foreign"
      foreign key ("user_id") references "user" ("id") on delete cascade on update cascade;
    `);
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "user_session" cascade;`);
  }
}
