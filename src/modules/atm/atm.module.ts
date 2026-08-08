import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashWithdrawal } from './entities/cash-withdrawal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CashWithdrawal])],
  exports: [TypeOrmModule],
})
export class AtmModule {}
