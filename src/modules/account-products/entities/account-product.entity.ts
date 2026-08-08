import { Check, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BankAccount } from '../../accounts/entities/bank-account.entity';
import { BankAccountCurrency } from '../../accounts/entities/bank-account.enum';

@Entity('account_products')
@Check(
  'account_product_limits_non_negative',
  '"daily_transfer_limit_minor" >= 0 AND "daily_withdrawal_limit_minor" >= 0 AND "maintenance_fee_minor" >= 0',
)
@Check('account_product_currency_valid', "\"currency\" IN ('ARS', 'USD')")
export class AccountProduct {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', unique: true })
  code!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ name: 'account_type', type: 'text' })
  accountType!: string;

  @Column({ name: 'tier_code', type: 'text' })
  tierCode!: string;

  @Column({ type: 'varchar', length: 3 })
  currency!: BankAccountCurrency;

  @Column({ name: 'daily_transfer_limit_minor', type: 'bigint' })
  dailyTransferLimitMinor!: string;

  @Column({ name: 'daily_withdrawal_limit_minor', type: 'bigint' })
  dailyWithdrawalLimitMinor!: string;

  @Column({ name: 'maintenance_fee_minor', type: 'bigint', default: '0' })
  maintenanceFeeMinor!: string;

  @Column({ name: 'allows_overdraft', type: 'boolean', default: false })
  allowsOverdraft!: boolean;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => BankAccount, (account) => account.product)
  accounts!: BankAccount[];
}
