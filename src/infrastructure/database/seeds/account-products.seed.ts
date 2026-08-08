import { AccountProduct } from '../../../modules/account-products/entities/account-product.entity';
import { BankAccountCurrency } from '../../../modules/accounts/entities/bank-account.enum';
import { AppDataSource } from '../data-source';

export const accountProducts: Array<
  Pick<
    AccountProduct,
    | 'code'
    | 'name'
    | 'accountType'
    | 'tierCode'
    | 'currency'
    | 'dailyTransferLimitMinor'
    | 'dailyWithdrawalLimitMinor'
    | 'maintenanceFeeMinor'
    | 'allowsOverdraft'
    | 'enabled'
  >
> = [
  {
    code: 'CA_ARS_BASIC',
    name: 'Caja de ahorro ARS Basic',
    accountType: 'SAVINGS_ACCOUNT',
    tierCode: 'BASIC',
    currency: BankAccountCurrency.ARS,
    dailyTransferLimitMinor: '50000000',
    dailyWithdrawalLimitMinor: '15000000',
    maintenanceFeeMinor: '0',
    allowsOverdraft: false,
    enabled: true,
  },
  {
    code: 'CA_ARS_SALARY',
    name: 'Caja de ahorro sueldo ARS',
    accountType: 'SAVINGS_ACCOUNT',
    tierCode: 'SALARY',
    currency: BankAccountCurrency.ARS,
    dailyTransferLimitMinor: '200000000',
    dailyWithdrawalLimitMinor: '30000000',
    maintenanceFeeMinor: '0',
    allowsOverdraft: false,
    enabled: true,
  },
  {
    code: 'CA_ARS_PREMIUM',
    name: 'Caja de ahorro ARS Premium',
    accountType: 'SAVINGS_ACCOUNT',
    tierCode: 'PREMIUM',
    currency: BankAccountCurrency.ARS,
    dailyTransferLimitMinor: '1000000000',
    dailyWithdrawalLimitMinor: '70000000',
    maintenanceFeeMinor: '2500000',
    allowsOverdraft: false,
    enabled: true,
  },
  {
    code: 'CC_ARS_PYME',
    name: 'Cuenta corriente ARS PyME',
    accountType: 'CURRENT_ACCOUNT',
    tierCode: 'PYME',
    currency: BankAccountCurrency.ARS,
    dailyTransferLimitMinor: '2500000000',
    dailyWithdrawalLimitMinor: '100000000',
    maintenanceFeeMinor: '5000000',
    allowsOverdraft: true,
    enabled: true,
  },
  {
    code: 'CA_USD_STANDARD',
    name: 'Caja de ahorro USD Standard',
    accountType: 'SAVINGS_ACCOUNT',
    tierCode: 'STANDARD',
    currency: BankAccountCurrency.USD,
    dailyTransferLimitMinor: '1000000',
    dailyWithdrawalLimitMinor: '100000',
    maintenanceFeeMinor: '1000',
    allowsOverdraft: false,
    enabled: true,
  },
];

export async function seedAccountProducts(): Promise<void> {
  await AppDataSource.getRepository(AccountProduct).upsert(accountProducts, ['code']);
}

async function run(): Promise<void> {
  await AppDataSource.initialize();

  try {
    await seedAccountProducts();
  } finally {
    await AppDataSource.destroy();
  }
}

void run();
