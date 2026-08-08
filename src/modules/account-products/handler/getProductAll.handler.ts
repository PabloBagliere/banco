import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountProduct } from '../entities/account-product.entity';
import { ActiveAccountProduct, GetProductAccountAllQuery } from '../query/get-product-account-all.query';

@QueryHandler(GetProductAccountAllQuery)
export class GetProductAccountAllHandler implements IQueryHandler<GetProductAccountAllQuery> {
  constructor(
    @InjectRepository(AccountProduct)
    private readonly accountProductRepository: Repository<AccountProduct>,
  ) {}

  async execute(): Promise<ActiveAccountProduct[]> {
    const result = await this.accountProductRepository.find({
      select: {
        code: true,
        name: true,
        accountType: true,
        tierCode: true,
        currency: true,
        dailyTransferLimitMinor: true,
        dailyWithdrawalLimitMinor: true,
        maintenanceFeeMinor: true,
        allowsOverdraft: true,
      },
      where: {
        enabled: true,
      },
    });
    return result;
  }
}
