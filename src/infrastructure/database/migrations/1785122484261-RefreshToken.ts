import { MigrationInterface, QueryRunner } from 'typeorm';

// NOTA: migration:generate creó refresh_token pero NO generó el DROP de
// "session" (TypeORM no baja tablas huérfanas por seguridad). El DROP de
// "session" se agregó a mano: es la tabla de sesiones de BetterAuth,
// reemplazada por refresh_token (decisión JWT HS256, ver roadmap/decisiones.md).
export class RefreshToken1785122484261 implements MigrationInterface {
  name = 'RefreshToken1785122484261';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "refresh_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token_hash" text NOT NULL, "user_id" uuid NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "replaced_by" uuid, "ip_address" text, "user_agent" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_f0812282fad2e352cdaf83ef0a9" UNIQUE ("token_hash"), CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "refreshToken_userId_idx" ON "refresh_token"  ("user_id") `);
    await queryRunner.query(
      `ALTER TABLE "refresh_token" ADD CONSTRAINT "FK_6bbe63d2fe75e7f0ba1710351d4" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "session" DROP CONSTRAINT "FK_30e98e8746699fb9af235410aff"`);
    await queryRunner.query(`DROP INDEX "public"."session_userId_idx"`);
    await queryRunner.query(`DROP TABLE "session"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "token" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ip_address" text, "user_agent" text, "user_id" uuid NOT NULL, "impersonated_by" uuid, CONSTRAINT "UQ_232f8e85d7633bd6ddfad421696" UNIQUE ("token"), CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "session_userId_idx" ON "session"  ("user_id") `);
    await queryRunner.query(
      `ALTER TABLE "session" ADD CONSTRAINT "FK_30e98e8746699fb9af235410aff" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "refresh_token" DROP CONSTRAINT "FK_6bbe63d2fe75e7f0ba1710351d4"`);
    await queryRunner.query(`DROP INDEX "public"."refreshToken_userId_idx"`);
    await queryRunner.query(`DROP TABLE "refresh_token"`);
  }
}
