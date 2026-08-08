import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountProductsModule } from '../account-products/account-products.module';
import { BankAccount } from './entities/bank-account.entity';
import { OpenAccountHandler } from './handler/openAccount.handler';

@Module({
  imports: [TypeOrmModule.forFeature([BankAccount]), AccountProductsModule],
  exports: [TypeOrmModule],
  providers: [OpenAccountHandler],
})
export class AccountsModule {}
