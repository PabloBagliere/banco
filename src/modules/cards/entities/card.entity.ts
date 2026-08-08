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
import { User } from '../../users/entities/user.entity';

export enum CardStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum CreditAccountStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  CLOSED = 'CLOSED',
}

export enum CardTransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  REVERSED = 'REVERSED',
}

export enum CreditCardStatementStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

@Entity('debit_cards')
@Check('debit_card_expiration_month_valid', '"expiration_month" BETWEEN 1 AND 12')
export class DebitCard {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('debit_cards_bank_account_id_idx')
  @Column({ name: 'bank_account_id', type: 'uuid' })
  bankAccountId!: string;

  @Column({ name: 'card_number_token', type: 'text', unique: true })
  cardNumberToken!: string;

  @Column({ name: 'last_four', type: 'varchar', length: 4 })
  lastFour!: string;

  @Column({ name: 'holder_name', type: 'text' })
  holderName!: string;

  @Column({ name: 'expiration_month', type: 'smallint' })
  expirationMonth!: number;

  @Column({ name: 'expiration_year', type: 'smallint' })
  expirationYear!: number;

  @Column({ type: 'enum', enum: CardStatus, enumName: 'card_status', default: CardStatus.ACTIVE })
  status!: CardStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => BankAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount!: BankAccount;
}

@Entity('credit_accounts')
@Check(
  'credit_account_amounts_non_negative',
  '"credit_limit_minor" >= 0 AND "available_credit_minor" >= 0 AND "current_balance_minor" >= 0',
)
@Check('credit_account_days_valid', '"closing_day" BETWEEN 1 AND 31 AND "due_day" BETWEEN 1 AND 31')
@Check('credit_account_currency_valid', "\"currency\" IN ('ARS', 'USD')")
export class CreditAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('credit_accounts_user_id_idx')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 3 })
  currency!: BankAccountCurrency;

  @Column({ name: 'credit_limit_minor', type: 'bigint' })
  creditLimitMinor!: string;

  @Column({ name: 'available_credit_minor', type: 'bigint' })
  availableCreditMinor!: string;

  @Column({ name: 'current_balance_minor', type: 'bigint', default: '0' })
  currentBalanceMinor!: string;

  @Column({ name: 'closing_day', type: 'smallint' })
  closingDay!: number;

  @Column({ name: 'due_day', type: 'smallint' })
  dueDay!: number;

  @Column({
    type: 'enum',
    enum: CreditAccountStatus,
    enumName: 'credit_account_status',
    default: CreditAccountStatus.ACTIVE,
  })
  status!: CreditAccountStatus;

  @Index('credit_accounts_payment_bank_account_id_idx')
  @Column({ name: 'payment_bank_account_id', type: 'uuid', nullable: true })
  paymentBankAccountId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => BankAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'payment_bank_account_id' })
  paymentBankAccount!: BankAccount | null;
}

@Entity('credit_cards')
@Check('credit_card_expiration_month_valid', '"expiration_month" BETWEEN 1 AND 12')
export class CreditCard {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('credit_cards_credit_account_id_idx')
  @Column({ name: 'credit_account_id', type: 'uuid' })
  creditAccountId!: string;

  @Column({ name: 'card_number_token', type: 'text', unique: true })
  cardNumberToken!: string;

  @Column({ name: 'last_four', type: 'varchar', length: 4 })
  lastFour!: string;

  @Column({ name: 'holder_name', type: 'text' })
  holderName!: string;

  @Column({ name: 'expiration_month', type: 'smallint' })
  expirationMonth!: number;

  @Column({ name: 'expiration_year', type: 'smallint' })
  expirationYear!: number;

  @Column({ type: 'enum', enum: CardStatus, enumName: 'credit_card_status', default: CardStatus.ACTIVE })
  status!: CardStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => CreditAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'credit_account_id' })
  creditAccount!: CreditAccount;
}

@Entity('card_transactions')
@Check('card_transaction_amount_positive', '"amount_minor" > 0')
@Check('card_transaction_has_one_card', '("debit_card_id" IS NOT NULL) <> ("credit_card_id" IS NOT NULL)')
@Check('card_transaction_currency_valid', "\"currency\" IN ('ARS', 'USD')")
export class CardTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('card_transactions_debit_card_id_idx')
  @Column({ name: 'debit_card_id', type: 'uuid', nullable: true })
  debitCardId!: string | null;

  @Index('card_transactions_credit_card_id_idx')
  @Column({ name: 'credit_card_id', type: 'uuid', nullable: true })
  creditCardId!: string | null;

  @Index('card_transactions_ledger_transaction_id_unique', { unique: true })
  @Column({ name: 'ledger_transaction_id', type: 'uuid', nullable: true })
  ledgerTransactionId!: string | null;

  @Column({ name: 'amount_minor', type: 'bigint' })
  amountMinor!: string;

  @Column({ type: 'varchar', length: 3 })
  currency!: BankAccountCurrency;

  @Column({ name: 'merchant_name', type: 'text' })
  merchantName!: string;

  @Column({ name: 'merchant_category_code', type: 'varchar', length: 4, nullable: true })
  merchantCategoryCode!: string | null;

  @Column({
    type: 'enum',
    enum: CardTransactionStatus,
    enumName: 'card_transaction_status',
    default: CardTransactionStatus.PENDING,
  })
  status!: CardTransactionStatus;

  @Column({ name: 'authorization_code', type: 'varchar', length: 100, nullable: true })
  authorizationCode!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => DebitCard, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'debit_card_id' })
  debitCard!: DebitCard | null;

  @ManyToOne(() => CreditCard, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'credit_card_id' })
  creditCard!: CreditCard | null;

  @ManyToOne(() => LedgerTransaction, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ledger_transaction_id' })
  ledgerTransaction!: LedgerTransaction | null;
}

@Entity('credit_card_statements')
@Check('credit_card_statement_period_valid', '"period_start" <= "period_end"')
@Check('credit_card_statement_amounts_non_negative', '"total_minor" >= 0 AND "minimum_payment_minor" >= 0')
export class CreditCardStatement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('credit_card_statements_credit_account_id_idx')
  @Column({ name: 'credit_account_id', type: 'uuid' })
  creditAccountId!: string;

  @Column({ name: 'period_start', type: 'date' })
  periodStart!: string;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd!: string;

  @Column({ name: 'closing_date', type: 'date' })
  closingDate!: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate!: string;

  @Column({ name: 'total_minor', type: 'bigint' })
  totalMinor!: string;

  @Column({ name: 'minimum_payment_minor', type: 'bigint' })
  minimumPaymentMinor!: string;

  @Column({
    type: 'enum',
    enum: CreditCardStatementStatus,
    enumName: 'credit_card_statement_status',
    default: CreditCardStatementStatus.OPEN,
  })
  status!: CreditCardStatementStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => CreditAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'credit_account_id' })
  creditAccount!: CreditAccount;
}
