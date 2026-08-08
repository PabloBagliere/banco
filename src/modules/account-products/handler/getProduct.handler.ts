import { InternalServerErrorException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountProduct } from '../entities/account-product.entity';
import { GetProductAccountQuery } from '../query/get-product-account.query';

@QueryHandler(GetProductAccountQuery)
export class GetProductAccountHandler implements IQueryHandler<GetProductAccountQuery> {
  constructor(
    @InjectRepository(AccountProduct)
    private readonly accountProductRepository: Repository<AccountProduct>,
  ) {}

  async execute(query: GetProductAccountQuery): Promise<AccountProduct> {
    const result = await this.accountProductRepository.findOne({
      where: {
        code: query.code,
      },
    });
    if (!result) {
      throw new InternalServerErrorException();
    }
    return result;
  }
}
