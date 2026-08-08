import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BankAccount } from '../../accounts/entities/bank-account.entity';
import { BankAccountCurrency } from '../../accounts/entities/bank-account.enum';

export enum LedgerTransactionType {
  TRANSFER = 'TRANSFER',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  CARD_PAYMENT = 'CARD_PAYMENT',
  SERVICE_PAYMENT = 'SERVICE_PAYMENT',
  REVERSAL = 'REVERSAL',
}

export enum LedgerTransactionStatus {
  PENDING = 'PENDING',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
  FAILED = 'FAILED',
}

export enum LedgerEntryDirection {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

@Entity('ledger_transactions')
export class LedgerTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('ledger_transactions_idempotency_key_unique', { unique: true, where: '"idempotency_key" IS NOT NULL' })
  @Column({ name: 'idempotency_key', type: 'varchar', length: 255, nullable: true })
  idempotencyKey!: string | null;

  @Column({ type: 'enum', enum: LedgerTransactionType, enumName: 'ledger_transaction_type' })
  type!: LedgerTransactionType;

  @Column({
    type: 'enum',
    enum: LedgerTransactionStatus,
    enumName: 'ledger_transaction_status',
    default: LedgerTransactionStatus.PENDING,
  })
  status!: LedgerTransactionStatus;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId!: string | null;

  @Column({ name: 'reference_type', type: 'varchar', length: 100, nullable: true })
  referenceType!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Index('ledger_transactions_reversal_of_id_unique', { unique: true, where: '"reversal_of_id" IS NOT NULL' })
  @Column({ name: 'reversal_of_id', type: 'uuid', nullable: true })
  reversalOfId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => LedgerTransaction, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reversal_of_id' })
  reversalOf!: LedgerTransaction | null;

  @OneToMany(() => LedgerEntry, (entry) => entry.transaction)
  entries!: LedgerEntry[];
}

@Entity('ledger_entries')
@Check('ledger_entry_amount_positive', '"amount_minor" > 0')
@Check('ledger_entry_currency_valid', "\"currency\" IN ('ARS', 'USD')")
@Index('ledger_entries_bank_account_id_created_at_idx', ['bankAccountId', 'createdAt'])
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('ledger_entries_transaction_id_idx')
  @Column({ name: 'transaction_id', type: 'uuid' })
  transactionId!: string;

  @Column({ name: 'bank_account_id', type: 'uuid' })
  bankAccountId!: string;

  @Column({ type: 'enum', enum: LedgerEntryDirection, enumName: 'ledger_entry_direction' })
  direction!: LedgerEntryDirection;

  @Column({ name: 'amount_minor', type: 'bigint' })
  amountMinor!: string;

  @Column({ type: 'varchar', length: 3 })
  currency!: BankAccountCurrency;

  @Column({ name: 'balance_after_minor', type: 'bigint' })
  balanceAfterMinor!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => LedgerTransaction, (transaction) => transaction.entries, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'transaction_id' })
  transaction!: LedgerTransaction;

  @ManyToOne(() => BankAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount!: BankAccount;
}
