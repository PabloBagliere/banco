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
import { BankAccountCurrency, BankAccountStatus } from './bank-account.enum';
import { AccountProduct } from '../../account-products/entities/account-product.entity';
import { User } from '../../users/entities/user.entity';

@Entity('bank_accounts')
@Check('bank_account_available_balance_non_negative', '"available_balance_minor" >= 0')
@Check('bank_account_ledger_balance_non_negative', '"ledger_balance_minor" >= 0')
@Check('bank_account_currency_valid', "\"currency\" IN ('ARS', 'USD')")
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('bank_accounts_user_id_idx')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 22, unique: true })
  cbu!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  alias!: string;

  @Column({ type: 'varchar', length: 3 })
  currency!: BankAccountCurrency;

  @Index('bank_accounts_product_id_idx')
  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ type: 'enum', enum: BankAccountStatus, enumName: 'bank_account_status', default: BankAccountStatus.ACTIVE })
  status!: BankAccountStatus;

  @Column({ name: 'available_balance_minor', type: 'bigint', default: '0' })
  availableBalanceMinor!: string;

  @Column({ name: 'ledger_balance_minor', type: 'bigint', default: '0' })
  ledgerBalanceMinor!: string;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => AccountProduct, (product) => product.accounts, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: AccountProduct;
}
