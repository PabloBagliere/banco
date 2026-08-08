import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountProduct, BankAccount } from './entities/bank-account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BankAccount, AccountProduct])],
  exports: [TypeOrmModule],
})
export class AccountsModule {}
