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
  UpdateDateColumn,
} from 'typeorm';
import { BankAccount } from '../../accounts/entities/bank-account.entity';
import { BankAccountCurrency } from '../../accounts/entities/bank-account.enum';
import { LedgerTransaction } from '../../ledger/entities/ledger-transaction.entity';

export enum ServicePaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

@Entity('service_providers')
export class ServiceProvider {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', unique: true })
  code!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => ServicePayment, (payment) => payment.serviceProvider)
  payments!: ServicePayment[];
}

@Entity('service_payments')
@Check('service_payment_amount_positive', '"amount_minor" > 0')
@Check('service_payment_currency_valid', "\"currency\" IN ('ARS', 'USD')")
export class ServicePayment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('service_payments_bank_account_id_idx')
  @Column({ name: 'bank_account_id', type: 'uuid' })
  bankAccountId!: string;

  @Index('service_payments_ledger_transaction_id_unique', { unique: true })
  @Column({ name: 'ledger_transaction_id', type: 'uuid', nullable: true })
  ledgerTransactionId!: string | null;

  @Index('service_payments_service_provider_id_idx')
  @Column({ name: 'service_provider_id', type: 'uuid' })
  serviceProviderId!: string;

  @Column({ name: 'payment_reference', type: 'varchar', length: 255 })
  paymentReference!: string;

  @Column({ name: 'amount_minor', type: 'bigint' })
  amountMinor!: string;

  @Column({ type: 'varchar', length: 3 })
  currency!: BankAccountCurrency;

  @Column({
    type: 'enum',
    enum: ServicePaymentStatus,
    enumName: 'service_payment_status',
    default: ServicePaymentStatus.PENDING,
  })
  status!: ServicePaymentStatus;

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

  @ManyToOne(() => ServiceProvider, (provider) => provider.payments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'service_provider_id' })
  serviceProvider!: ServiceProvider;
}
