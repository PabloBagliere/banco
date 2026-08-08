import { Query } from '@nestjs/cqrs';
import { AccountProduct } from '../entities/account-product.entity';

export type ActiveAccountProduct = Pick<
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
>;

export class GetProductAccountAllQuery extends Query<ActiveAccountProduct[]> {
  constructor() {
    super();
  }
}
