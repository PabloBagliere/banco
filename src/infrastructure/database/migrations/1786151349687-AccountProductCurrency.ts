import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountProductCurrency1786151349687 implements MigrationInterface {
  name = 'AccountProductCurrency1786151349687';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "account_products" ADD "currency" character varying(3) NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "account_products" ADD CONSTRAINT "account_product_currency_valid" CHECK ("currency" IN ('ARS', 'USD'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "account_products" DROP CONSTRAINT "account_product_currency_valid"`);
    await queryRunner.query(`ALTER TABLE "account_products" DROP COLUMN "currency"`);
  }
}
