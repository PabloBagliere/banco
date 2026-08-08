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

export enum CashWithdrawalStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

@Entity('cash_withdrawals')
@Check('cash_withdrawal_amount_positive', '"amount_minor" > 0')
@Check('cash_withdrawal_currency_valid', "\"currency\" IN ('ARS', 'USD')")
export class CashWithdrawal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('cash_withdrawals_bank_account_id_idx')
  @Column({ name: 'bank_account_id', type: 'uuid' })
  bankAccountId!: string;

  @Index('cash_withdrawals_ledger_transaction_id_unique', { unique: true })
  @Column({ name: 'ledger_transaction_id', type: 'uuid', nullable: true })
  ledgerTransactionId!: string | null;

  @Column({ name: 'atm_id', type: 'varchar', length: 100 })
  atmId!: string;

  @Column({ name: 'amount_minor', type: 'bigint' })
  amountMinor!: string;

  @Column({ type: 'varchar', length: 3 })
  currency!: BankAccountCurrency;

  @Column({
    type: 'enum',
    enum: CashWithdrawalStatus,
    enumName: 'cash_withdrawal_status',
    default: CashWithdrawalStatus.PENDING,
  })
  status!: CashWithdrawalStatus;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => BankAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount!: BankAccount;

  @ManyToOne(() => LedgerTransaction, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ledger_transaction_id' })
  ledgerTransaction!: LedgerTransaction | null;
}
