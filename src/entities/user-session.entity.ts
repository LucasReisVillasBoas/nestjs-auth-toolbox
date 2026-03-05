import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Index,
} from "@mikro-orm/core";
import { DefaultEntity } from "./default.entity";
import { User } from "./user.entity";

@Entity({ tableName: "user_session" })
export class UserSession extends DefaultEntity {
  @PrimaryKey({ type: "uuid", defaultRaw: "gen_random_uuid()" })
  id!: string;

  @ManyToOne(() => User)
  user!: User;

  @Index()
  @Property({ unique: true, length: 128 })
  token_hash!: string;

  @Property({ nullable: true, length: 255 })
  ip?: string;

  @Property({ nullable: true, length: 512 })
  user_agent?: string;

  @Property()
  expires_at!: Date;

  @Property({ nullable: true })
  revoked_at?: Date;
}
