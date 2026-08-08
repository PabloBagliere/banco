import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountProductsController } from './account-products.controller';
import { AccountProduct } from './entities/account-product.entity';
import { GetProductAccountHandler } from './handler/getProduct.handler';
import { GetProductAccountAllHandler } from './handler/getProductAll.handler';

@Module({
  imports: [TypeOrmModule.forFeature([AccountProduct])],
  controllers: [AccountProductsController],
  exports: [TypeOrmModule],
  providers: [GetProductAccountHandler, GetProductAccountAllHandler],
})
export class AccountProductsModule {}
