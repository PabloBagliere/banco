import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BankAccount, BankAccountCurrency } from '../../accounts/entities/bank-account.entity';
import { LedgerTransaction } from '../../ledger/entities/ledger-transaction.entity';

export enum TransferStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

@Entity('transfers')
@Check('transfer_amount_positive', '"amount_minor" > 0')
@Check('transfer_currency_valid', "\"currency\" IN ('ARS', 'USD')")
export class Transfer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('transfers_source_account_id_idx')
  @Column({ name: 'source_account_id', type: 'uuid' })
  sourceAccountId!: string;

  @Index('transfers_destination_account_id_idx')
  @Column({ name: 'destination_account_id', type: 'uuid' })
  destinationAccountId!: string;

  @Column({ name: 'amount_minor', type: 'bigint' })
  amountMinor!: string;

  @Column({ type: 'varchar', length: 3 })
  currency!: BankAccountCurrency;

  @Column({ type: 'text', nullable: true })
  concept!: string | null;

  @Index('transfers_idempotency_key_unique', { unique: true })
  @Column({ name: 'idempotency_key', type: 'varchar', length: 255 })
  idempotencyKey!: string;

  @Index('transfers_ledger_transaction_id_unique', { unique: true })
  @Column({ name: 'ledger_transaction_id', type: 'uuid', nullable: true })
  ledgerTransactionId!: string | null;

  @Column({ type: 'enum', enum: TransferStatus, enumName: 'transfer_status', default: TransferStatus.PENDING })
  status!: TransferStatus;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => BankAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'source_account_id' })
  sourceAccount!: BankAccount;

  @ManyToOne(() => BankAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'destination_account_id' })
  destinationAccount!: BankAccount;

  @ManyToOne(() => LedgerTransaction, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ledger_transaction_id' })
  ledgerTransaction!: LedgerTransaction | null;
}
