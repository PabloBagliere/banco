import { Query } from '@nestjs/cqrs';
import { AccountProduct } from '../entities/account-product.entity';

export class GetProductAccountQuery extends Query<AccountProduct> {
  constructor(public readonly code: string) {
    super();
  }
}
