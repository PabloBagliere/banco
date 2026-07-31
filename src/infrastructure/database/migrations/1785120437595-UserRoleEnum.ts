import { MigrationInterface, QueryRunner } from 'typeorm';

// NOTA: migration:generate generó DROP COLUMN + ADD COLUMN (pierde datos).
// Reescrito a mano con USING para convertir text → enum preservando las filas.
export class UserRoleEnum1785120437595 implements MigrationInterface {
  name = 'UserRoleEnum1785120437595';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('USER', 'ADMIN')`);
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "role" TYPE "public"."user_role_enum" USING "role"::"public"."user_role_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'USER'`);
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" TYPE text USING "role"::text`);
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
  }
}
