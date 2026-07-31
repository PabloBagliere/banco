import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitAuth1785103149617 implements MigrationInterface {
  name = 'InitAuth1785103149617';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "token" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ip_address" text, "user_agent" text, "user_id" uuid NOT NULL, "impersonated_by" uuid, CONSTRAINT "UQ_232f8e85d7633bd6ddfad421696" UNIQUE ("token"), CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "session_userId_idx" ON "session"  ("user_id") `);
    await queryRunner.query(
      `CREATE TABLE "two_factor" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "secret" text NOT NULL, "backup_codes" text NOT NULL, "user_id" uuid NOT NULL, "verified" boolean DEFAULT true, CONSTRAINT "PK_d9e707ebc943c110fcaab7cdd8c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "twoFactor_secret_idx" ON "two_factor"  ("secret") `);
    await queryRunner.query(`CREATE INDEX "twoFactor_userId_idx" ON "two_factor"  ("user_id") `);
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "email" text NOT NULL, "email_verified" boolean NOT NULL DEFAULT false, "image" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "username" text, "display_username" text, "two_factor_enabled" boolean DEFAULT false, "role" text, "banned" boolean DEFAULT false, "ban_reason" text, "ban_expires" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "account_id" text NOT NULL, "provider_id" text NOT NULL, "user_id" uuid NOT NULL, "access_token" text, "refresh_token" text, "id_token" text, "access_token_expires_at" TIMESTAMP WITH TIME ZONE, "refresh_token_expires_at" TIMESTAMP WITH TIME ZONE, "scope" text, "password" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "account_userId_idx" ON "account"  ("user_id") `);
    await queryRunner.query(
      `CREATE TABLE "verification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "identifier" text NOT NULL, "value" text NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f7e3a90ca384e71d6e2e93bb340" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "verification_identifier_idx" ON "verification"  ("identifier") `);
    await queryRunner.query(
      `ALTER TABLE "session" ADD CONSTRAINT "FK_30e98e8746699fb9af235410aff" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "two_factor" ADD CONSTRAINT "FK_162c7f53b41b84102a8e06eff18" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "FK_efef1e5fdbe318a379c06678c51" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "account" DROP CONSTRAINT "FK_efef1e5fdbe318a379c06678c51"`);
    await queryRunner.query(`ALTER TABLE "two_factor" DROP CONSTRAINT "FK_162c7f53b41b84102a8e06eff18"`);
    await queryRunner.query(`ALTER TABLE "session" DROP CONSTRAINT "FK_30e98e8746699fb9af235410aff"`);
    await queryRunner.query(`DROP INDEX "public"."verification_identifier_idx"`);
    await queryRunner.query(`DROP TABLE "verification"`);
    await queryRunner.query(`DROP INDEX "public"."account_userId_idx"`);
    await queryRunner.query(`DROP TABLE "account"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP INDEX "public"."twoFactor_userId_idx"`);
    await queryRunner.query(`DROP INDEX "public"."twoFactor_secret_idx"`);
    await queryRunner.query(`DROP TABLE "two_factor"`);
    await queryRunner.query(`DROP INDEX "public"."session_userId_idx"`);
    await queryRunner.query(`DROP TABLE "session"`);
  }
}
