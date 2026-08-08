import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { GetProductAccountAllQuery } from './query/get-product-account-all.query';

@ApiTags('account-products')
@Controller('account-products')
export class AccountProductsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  getActiveProducts() {
    return this.queryBus.execute(new GetProductAccountAllQuery());
  }
}
