import { MigrationInterface, QueryRunner } from 'typeorm';

export class BankingSchema1786143523852 implements MigrationInterface {
  name = 'BankingSchema1786143523852';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "account_products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" text NOT NULL, "name" text NOT NULL, "account_type" text NOT NULL, "tier_code" text NOT NULL, "daily_transfer_limit_minor" bigint NOT NULL, "daily_withdrawal_limit_minor" bigint NOT NULL, "maintenance_fee_minor" bigint NOT NULL DEFAULT '0', "allows_overdraft" boolean NOT NULL DEFAULT false, "enabled" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_52033fba3408fbef12c46933d70" UNIQUE ("code"), CONSTRAINT "account_product_limits_non_negative" CHECK ("daily_transfer_limit_minor" >= 0 AND "daily_withdrawal_limit_minor" >= 0 AND "maintenance_fee_minor" >= 0), CONSTRAINT "PK_e35c444147b608f74b553d1e8f8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE TYPE "public"."bank_account_status" AS ENUM('ACTIVE', 'FROZEN', 'CLOSED')`);
    await queryRunner.query(
      `CREATE TABLE "bank_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "cbu" character varying(22) NOT NULL, "alias" character varying(100) NOT NULL, "currency" character varying(3) NOT NULL, "product_id" uuid NOT NULL, "status" "public"."bank_account_status" NOT NULL DEFAULT 'ACTIVE', "available_balance_minor" bigint NOT NULL DEFAULT '0', "ledger_balance_minor" bigint NOT NULL DEFAULT '0', "version" integer NOT NULL DEFAULT '1', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_9925062b6d681adf574278a3a97" UNIQUE ("cbu"), CONSTRAINT "UQ_ffaa4c34a2b644f3a93403d1606" UNIQUE ("alias"), CONSTRAINT "bank_account_currency_valid" CHECK ("currency" IN ('ARS', 'USD')), CONSTRAINT "bank_account_ledger_balance_non_negative" CHECK ("ledger_balance_minor" >= 0), CONSTRAINT "bank_account_available_balance_non_negative" CHECK ("available_balance_minor" >= 0), CONSTRAINT "PK_c872de764f2038224a013ff25ed" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "bank_accounts_user_id_idx" ON "bank_accounts"  ("user_id") `);
    await queryRunner.query(`CREATE INDEX "bank_accounts_product_id_idx" ON "bank_accounts"  ("product_id") `);
    await queryRunner.query(
      `CREATE TYPE "public"."ledger_transaction_type" AS ENUM('TRANSFER', 'DEPOSIT', 'WITHDRAWAL', 'CARD_PAYMENT', 'SERVICE_PAYMENT', 'REVERSAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ledger_transaction_status" AS ENUM('PENDING', 'POSTED', 'REVERSED', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ledger_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "idempotency_key" character varying(255), "type" "public"."ledger_transaction_type" NOT NULL, "status" "public"."ledger_transaction_status" NOT NULL DEFAULT 'PENDING', "reference_id" uuid, "reference_type" character varying(100), "description" text, "reversal_of_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_633d103c9e415d615aacf9b1929" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "ledger_transactions_idempotency_key_unique" ON "ledger_transactions"  ("idempotency_key") WHERE "idempotency_key" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "ledger_transactions_reversal_of_id_unique" ON "ledger_transactions"  ("reversal_of_id") WHERE "reversal_of_id" IS NOT NULL`,
    );
    await queryRunner.query(`CREATE TYPE "public"."ledger_entry_direction" AS ENUM('DEBIT', 'CREDIT')`);
    await queryRunner.query(
      `CREATE TABLE "ledger_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transaction_id" uuid NOT NULL, "bank_account_id" uuid NOT NULL, "direction" "public"."ledger_entry_direction" NOT NULL, "amount_minor" bigint NOT NULL, "currency" character varying(3) NOT NULL, "balance_after_minor" bigint NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "ledger_entry_currency_valid" CHECK ("currency" IN ('ARS', 'USD')), CONSTRAINT "ledger_entry_amount_positive" CHECK ("amount_minor" > 0), CONSTRAINT "PK_6efcb84411d3f08b08450ae75d5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "ledger_entries_transaction_id_idx" ON "ledger_entries"  ("transaction_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "ledger_entries_bank_account_id_created_at_idx" ON "ledger_entries"  ("bank_account_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cash_withdrawal_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "cash_withdrawals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bank_account_id" uuid NOT NULL, "ledger_transaction_id" uuid, "atm_id" character varying(100) NOT NULL, "amount_minor" bigint NOT NULL, "currency" character varying(3) NOT NULL, "status" "public"."cash_withdrawal_status" NOT NULL DEFAULT 'PENDING', "failure_reason" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "cash_withdrawal_currency_valid" CHECK ("currency" IN ('ARS', 'USD')), CONSTRAINT "cash_withdrawal_amount_positive" CHECK ("amount_minor" > 0), CONSTRAINT "PK_799fa5941779ecec5cf9460afcd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "cash_withdrawals_bank_account_id_idx" ON "cash_withdrawals"  ("bank_account_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "cash_withdrawals_ledger_transaction_id_unique" ON "cash_withdrawals"  ("ledger_transaction_id") `,
    );
    await queryRunner.query(`CREATE TYPE "public"."audit_actor_type" AS ENUM('USER', 'SYSTEM')`);
    await queryRunner.query(
      `CREATE TABLE "audit_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actor_type" "public"."audit_actor_type" NOT NULL, "actor_id" uuid, "action" character varying(100) NOT NULL, "entity_type" character varying(100) NOT NULL, "entity_id" uuid, "request_id" uuid, "ip_address" inet, "user_agent" text, "metadata" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_910f64d901a5c3e9878f0d4a407" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "audit_events_actor_id_created_at_idx" ON "audit_events"  ("actor_id", "created_at") `,
    );
    await queryRunner.query(`CREATE INDEX "audit_events_entity_idx" ON "audit_events"  ("entity_type", "entity_id") `);
    await queryRunner.query(`CREATE TYPE "public"."card_status" AS ENUM('ACTIVE', 'BLOCKED', 'EXPIRED', 'CANCELLED')`);
    await queryRunner.query(
      `CREATE TABLE "debit_cards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bank_account_id" uuid NOT NULL, "card_number_token" text NOT NULL, "last_four" character varying(4) NOT NULL, "holder_name" text NOT NULL, "expiration_month" smallint NOT NULL, "expiration_year" smallint NOT NULL, "status" "public"."card_status" NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_3390bb27ac820e3948608210e5c" UNIQUE ("card_number_token"), CONSTRAINT "debit_card_expiration_month_valid" CHECK ("expiration_month" BETWEEN 1 AND 12), CONSTRAINT "PK_0f2b5f63cbceb88b3f42710485e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "debit_cards_bank_account_id_idx" ON "debit_cards"  ("bank_account_id") `);
    await queryRunner.query(`CREATE TYPE "public"."credit_account_status" AS ENUM('ACTIVE', 'BLOCKED', 'CLOSED')`);
    await queryRunner.query(
      `CREATE TABLE "credit_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "currency" character varying(3) NOT NULL, "credit_limit_minor" bigint NOT NULL, "available_credit_minor" bigint NOT NULL, "current_balance_minor" bigint NOT NULL DEFAULT '0', "closing_day" smallint NOT NULL, "due_day" smallint NOT NULL, "status" "public"."credit_account_status" NOT NULL DEFAULT 'ACTIVE', "payment_bank_account_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "credit_account_currency_valid" CHECK ("currency" IN ('ARS', 'USD')), CONSTRAINT "credit_account_days_valid" CHECK ("closing_day" BETWEEN 1 AND 31 AND "due_day" BETWEEN 1 AND 31), CONSTRAINT "credit_account_amounts_non_negative" CHECK ("credit_limit_minor" >= 0 AND "available_credit_minor" >= 0 AND "current_balance_minor" >= 0), CONSTRAINT "PK_a81047fa386ce9ab9567c763d72" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "credit_accounts_user_id_idx" ON "credit_accounts"  ("user_id") `);
    await queryRunner.query(
      `CREATE INDEX "credit_accounts_payment_bank_account_id_idx" ON "credit_accounts"  ("payment_bank_account_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."credit_card_status" AS ENUM('ACTIVE', 'BLOCKED', 'EXPIRED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "credit_cards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "credit_account_id" uuid NOT NULL, "card_number_token" text NOT NULL, "last_four" character varying(4) NOT NULL, "holder_name" text NOT NULL, "expiration_month" smallint NOT NULL, "expiration_year" smallint NOT NULL, "status" "public"."credit_card_status" NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_fbd2c0475dcca839255bc45e4a4" UNIQUE ("card_number_token"), CONSTRAINT "credit_card_expiration_month_valid" CHECK ("expiration_month" BETWEEN 1 AND 12), CONSTRAINT "PK_7749b596e358703bb3dd8b45b7c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "credit_cards_credit_account_id_idx" ON "credit_cards"  ("credit_account_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."card_transaction_status" AS ENUM('PENDING', 'APPROVED', 'DECLINED', 'REVERSED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "card_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "debit_card_id" uuid, "credit_card_id" uuid, "ledger_transaction_id" uuid, "amount_minor" bigint NOT NULL, "currency" character varying(3) NOT NULL, "merchant_name" text NOT NULL, "merchant_category_code" character varying(4), "status" "public"."card_transaction_status" NOT NULL DEFAULT 'PENDING', "authorization_code" character varying(100), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "card_transaction_currency_valid" CHECK ("currency" IN ('ARS', 'USD')), CONSTRAINT "card_transaction_has_one_card" CHECK (("debit_card_id" IS NOT NULL) <> ("credit_card_id" IS NOT NULL)), CONSTRAINT "card_transaction_amount_positive" CHECK ("amount_minor" > 0), CONSTRAINT "PK_b8134a1a069b742d44cfffe7418" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "card_transactions_debit_card_id_idx" ON "card_transactions"  ("debit_card_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "card_transactions_credit_card_id_idx" ON "card_transactions"  ("credit_card_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "card_transactions_ledger_transaction_id_unique" ON "card_transactions"  ("ledger_transaction_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."credit_card_statement_status" AS ENUM('OPEN', 'CLOSED', 'PAID', 'OVERDUE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "credit_card_statements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "credit_account_id" uuid NOT NULL, "period_start" date NOT NULL, "period_end" date NOT NULL, "closing_date" date NOT NULL, "due_date" date NOT NULL, "total_minor" bigint NOT NULL, "minimum_payment_minor" bigint NOT NULL, "status" "public"."credit_card_statement_status" NOT NULL DEFAULT 'OPEN', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "credit_card_statement_amounts_non_negative" CHECK ("total_minor" >= 0 AND "minimum_payment_minor" >= 0), CONSTRAINT "credit_card_statement_period_valid" CHECK ("period_start" <= "period_end"), CONSTRAINT "PK_c341e09611ffa8f98c0414dc98d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "credit_card_statements_credit_account_id_idx" ON "credit_card_statements"  ("credit_account_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "service_providers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" text NOT NULL, "name" text NOT NULL, "enabled" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_c89531d814665267d72eed45717" UNIQUE ("code"), CONSTRAINT "PK_73c86f1298c5285d76e66da2da9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."service_payment_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "service_payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bank_account_id" uuid NOT NULL, "ledger_transaction_id" uuid, "service_provider_id" uuid NOT NULL, "payment_reference" character varying(255) NOT NULL, "amount_minor" bigint NOT NULL, "currency" character varying(3) NOT NULL, "status" "public"."service_payment_status" NOT NULL DEFAULT 'PENDING', "failure_reason" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "service_payment_currency_valid" CHECK ("currency" IN ('ARS', 'USD')), CONSTRAINT "service_payment_amount_positive" CHECK ("amount_minor" > 0), CONSTRAINT "PK_5e84d901fd4a405f6e2a622bbe1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "service_payments_bank_account_id_idx" ON "service_payments"  ("bank_account_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "service_payments_ledger_transaction_id_unique" ON "service_payments"  ("ledger_transaction_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "service_payments_service_provider_id_idx" ON "service_payments"  ("service_provider_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transfer_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "transfers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source_account_id" uuid NOT NULL, "destination_account_id" uuid NOT NULL, "amount_minor" bigint NOT NULL, "currency" character varying(3) NOT NULL, "concept" text, "idempotency_key" character varying(255) NOT NULL, "ledger_transaction_id" uuid, "status" "public"."transfer_status" NOT NULL DEFAULT 'PENDING', "failure_reason" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "transfer_currency_valid" CHECK ("currency" IN ('ARS', 'USD')), CONSTRAINT "transfer_amount_positive" CHECK ("amount_minor" > 0), CONSTRAINT "PK_f712e908b465e0085b4408cabc3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "transfers_source_account_id_idx" ON "transfers"  ("source_account_id") `);
    await queryRunner.query(
      `CREATE INDEX "transfers_destination_account_id_idx" ON "transfers"  ("destination_account_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "transfers_idempotency_key_unique" ON "transfers"  ("idempotency_key") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "transfers_ledger_transaction_id_unique" ON "transfers"  ("ledger_transaction_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_accounts" ADD CONSTRAINT "FK_29146c4a8026c77c712e01d922b" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_accounts" ADD CONSTRAINT "FK_21598440f614c439534b881ec58" FOREIGN KEY ("product_id") REFERENCES "account_products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_transactions" ADD CONSTRAINT "FK_4cc6dbbf784e3cc9be514628f91" FOREIGN KEY ("reversal_of_id") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_b26c5ef5853fd6e0a8680427f60" FOREIGN KEY ("transaction_id") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_a21407227deb973bff1c108ad0d" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_withdrawals" ADD CONSTRAINT "FK_2d664da7bfdf2edf213d8f7eaf6" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_withdrawals" ADD CONSTRAINT "FK_0a6e97c3a12d4428146d20c404f" FOREIGN KEY ("ledger_transaction_id") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "debit_cards" ADD CONSTRAINT "FK_ae548e3c9d990e8ab83555ca533" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_accounts" ADD CONSTRAINT "FK_e9e4079e4a9bc1ddeb3452b7f69" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_accounts" ADD CONSTRAINT "FK_1490ec83b8ffccc6090a5f569dc" FOREIGN KEY ("payment_bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_cards" ADD CONSTRAINT "FK_0444f8d829eed9c37c851223823" FOREIGN KEY ("credit_account_id") REFERENCES "credit_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "card_transactions" ADD CONSTRAINT "FK_9b8d7122dbe4f92efe92c32304f" FOREIGN KEY ("debit_card_id") REFERENCES "debit_cards"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "card_transactions" ADD CONSTRAINT "FK_14bfdc1f5dfd032b45f371419bd" FOREIGN KEY ("credit_card_id") REFERENCES "credit_cards"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "card_transactions" ADD CONSTRAINT "FK_142b8aea351c3b69678d4859daf" FOREIGN KEY ("ledger_transaction_id") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_card_statements" ADD CONSTRAINT "FK_3d111d679ec12fdcfd6ef2204dd" FOREIGN KEY ("credit_account_id") REFERENCES "credit_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_payments" ADD CONSTRAINT "FK_06d9e4b3e3fa8539f3326dcad21" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_payments" ADD CONSTRAINT "FK_789a1e882f11abfa6f98f65945e" FOREIGN KEY ("ledger_transaction_id") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_payments" ADD CONSTRAINT "FK_592fdd4debde2d90e7d5fd0e427" FOREIGN KEY ("service_provider_id") REFERENCES "service_providers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" ADD CONSTRAINT "FK_430dc3ea0fd856beb23d7e1fc5e" FOREIGN KEY ("source_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" ADD CONSTRAINT "FK_f684549b075c486c901e179e377" FOREIGN KEY ("destination_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" ADD CONSTRAINT "FK_37b9f0fee6a868b8f101caa374f" FOREIGN KEY ("ledger_transaction_id") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transfers" DROP CONSTRAINT "FK_37b9f0fee6a868b8f101caa374f"`);
    await queryRunner.query(`ALTER TABLE "transfers" DROP CONSTRAINT "FK_f684549b075c486c901e179e377"`);
    await queryRunner.query(`ALTER TABLE "transfers" DROP CONSTRAINT "FK_430dc3ea0fd856beb23d7e1fc5e"`);
    await queryRunner.query(`ALTER TABLE "service_payments" DROP CONSTRAINT "FK_592fdd4debde2d90e7d5fd0e427"`);
    await queryRunner.query(`ALTER TABLE "service_payments" DROP CONSTRAINT "FK_789a1e882f11abfa6f98f65945e"`);
    await queryRunner.query(`ALTER TABLE "service_payments" DROP CONSTRAINT "FK_06d9e4b3e3fa8539f3326dcad21"`);
    await queryRunner.query(`ALTER TABLE "credit_card_statements" DROP CONSTRAINT "FK_3d111d679ec12fdcfd6ef2204dd"`);
    await queryRunner.query(`ALTER TABLE "card_transactions" DROP CONSTRAINT "FK_142b8aea351c3b69678d4859daf"`);
    await queryRunner.query(`ALTER TABLE "card_transactions" DROP CONSTRAINT "FK_14bfdc1f5dfd032b45f371419bd"`);
    await queryRunner.query(`ALTER TABLE "card_transactions" DROP CONSTRAINT "FK_9b8d7122dbe4f92efe92c32304f"`);
    await queryRunner.query(`ALTER TABLE "credit_cards" DROP CONSTRAINT "FK_0444f8d829eed9c37c851223823"`);
    await queryRunner.query(`ALTER TABLE "credit_accounts" DROP CONSTRAINT "FK_1490ec83b8ffccc6090a5f569dc"`);
    await queryRunner.query(`ALTER TABLE "credit_accounts" DROP CONSTRAINT "FK_e9e4079e4a9bc1ddeb3452b7f69"`);
    await queryRunner.query(`ALTER TABLE "debit_cards" DROP CONSTRAINT "FK_ae548e3c9d990e8ab83555ca533"`);
    await queryRunner.query(`ALTER TABLE "cash_withdrawals" DROP CONSTRAINT "FK_0a6e97c3a12d4428146d20c404f"`);
    await queryRunner.query(`ALTER TABLE "cash_withdrawals" DROP CONSTRAINT "FK_2d664da7bfdf2edf213d8f7eaf6"`);
    await queryRunner.query(`ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_a21407227deb973bff1c108ad0d"`);
    await queryRunner.query(`ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_b26c5ef5853fd6e0a8680427f60"`);
    await queryRunner.query(`ALTER TABLE "ledger_transactions" DROP CONSTRAINT "FK_4cc6dbbf784e3cc9be514628f91"`);
    await queryRunner.query(`ALTER TABLE "bank_accounts" DROP CONSTRAINT "FK_21598440f614c439534b881ec58"`);
    await queryRunner.query(`ALTER TABLE "bank_accounts" DROP CONSTRAINT "FK_29146c4a8026c77c712e01d922b"`);
    await queryRunner.query(`DROP INDEX "public"."transfers_ledger_transaction_id_unique"`);
    await queryRunner.query(`DROP INDEX "public"."transfers_idempotency_key_unique"`);
    await queryRunner.query(`DROP INDEX "public"."transfers_destination_account_id_idx"`);
    await queryRunner.query(`DROP INDEX "public"."transfers_source_account_id_idx"`);
    await queryRunner.query(`DROP TABLE "transfers"`);
    await queryRunner.query(`DROP TYPE "public"."transfer_status"`);
    await queryRunner.query(`DROP INDEX "public"."service_payments_service_provider_id_idx"`);
    await queryRunner.query(`DROP INDEX "public"."service_payments_ledger_transaction_id_unique"`);
    await queryRunner.query(`DROP INDEX "public"."service_payments_bank_account_id_idx"`);
    await queryRunner.query(`DROP TABLE "service_payments"`);
    await queryRunner.query(`DROP TYPE "public"."service_payment_status"`);
    await queryRunner.query(`DROP TABLE "service_providers"`);
    await queryRunner.query(`DROP INDEX "public"."credit_card_statements_credit_account_id_idx"`);
    await queryRunner.query(`DROP TABLE "credit_card_statements"`);
    await queryRunner.query(`DROP TYPE "public"."credit_card_statement_status"`);
    await queryRunner.query(`DROP INDEX "public"."card_transactions_ledger_transaction_id_unique"`);
    await queryRunner.query(`DROP INDEX "public"."card_transactions_credit_card_id_idx"`);
    await queryRunner.query(`DROP INDEX "public"."card_transactions_debit_card_id_idx"`);
    await queryRunner.query(`DROP TABLE "card_transactions"`);
    await queryRunner.query(`DROP TYPE "public"."card_transaction_status"`);
    await queryRunner.query(`DROP INDEX "public"."credit_cards_credit_account_id_idx"`);
    await queryRunner.query(`DROP TABLE "credit_cards"`);
    await queryRunner.query(`DROP TYPE "public"."credit_card_status"`);
    await queryRunner.query(`DROP INDEX "public"."credit_accounts_payment_bank_account_id_idx"`);
    await queryRunner.query(`DROP INDEX "public"."credit_accounts_user_id_idx"`);
    await queryRunner.query(`DROP TABLE "credit_accounts"`);
    await queryRunner.query(`DROP TYPE "public"."credit_account_status"`);
    await queryRunner.query(`DROP INDEX "public"."debit_cards_bank_account_id_idx"`);
    await queryRunner.query(`DROP TABLE "debit_cards"`);
    await queryRunner.query(`DROP TYPE "public"."card_status"`);
    await queryRunner.query(`DROP INDEX "public"."audit_events_entity_idx"`);
    await queryRunner.query(`DROP INDEX "public"."audit_events_actor_id_created_at_idx"`);
    await queryRunner.query(`DROP TABLE "audit_events"`);
    await queryRunner.query(`DROP TYPE "public"."audit_actor_type"`);
    await queryRunner.query(`DROP INDEX "public"."cash_withdrawals_ledger_transaction_id_unique"`);
    await queryRunner.query(`DROP INDEX "public"."cash_withdrawals_bank_account_id_idx"`);
    await queryRunner.query(`DROP TABLE "cash_withdrawals"`);
    await queryRunner.query(`DROP TYPE "public"."cash_withdrawal_status"`);
    await queryRunner.query(`DROP INDEX "public"."ledger_entries_bank_account_id_created_at_idx"`);
    await queryRunner.query(`DROP INDEX "public"."ledger_entries_transaction_id_idx"`);
    await queryRunner.query(`DROP TABLE "ledger_entries"`);
    await queryRunner.query(`DROP TYPE "public"."ledger_entry_direction"`);
    await queryRunner.query(`DROP INDEX "public"."ledger_transactions_reversal_of_id_unique"`);
    await queryRunner.query(`DROP INDEX "public"."ledger_transactions_idempotency_key_unique"`);
    await queryRunner.query(`DROP TABLE "ledger_transactions"`);
    await queryRunner.query(`DROP TYPE "public"."ledger_transaction_status"`);
    await queryRunner.query(`DROP TYPE "public"."ledger_transaction_type"`);
    await queryRunner.query(`DROP INDEX "public"."bank_accounts_product_id_idx"`);
    await queryRunner.query(`DROP INDEX "public"."bank_accounts_user_id_idx"`);
    await queryRunner.query(`DROP TABLE "bank_accounts"`);
    await queryRunner.query(`DROP TYPE "public"."bank_account_status"`);
    await queryRunner.query(`DROP TABLE "account_products"`);
  }
}
