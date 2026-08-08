import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerEntry, LedgerTransaction } from './entities/ledger-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LedgerTransaction, LedgerEntry])],
  exports: [TypeOrmModule],
})
export class LedgerModule {}
