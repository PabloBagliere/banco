import { MigrationInterface, QueryRunner } from 'typeorm';

export class LedgerEntriesAccountDateIndex1786143631253 implements MigrationInterface {
  name = 'LedgerEntriesAccountDateIndex1786143631253';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."ledger_entries_bank_account_id_created_at_idx"`);
    await queryRunner.query(
      `CREATE INDEX "ledger_entries_bank_account_id_created_at_idx" ON "ledger_entries"  ("bank_account_id", "created_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."ledger_entries_bank_account_id_created_at_idx"`);
    await queryRunner.query(
      `CREATE INDEX "ledger_entries_bank_account_id_created_at_idx" ON "ledger_entries" USING btree ("bank_account_id") `,
    );
  }
}
