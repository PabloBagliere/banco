import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardTransaction, CreditAccount, CreditCard, CreditCardStatement, DebitCard } from './entities/card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DebitCard, CreditAccount, CreditCard, CardTransaction, CreditCardStatement])],
  exports: [TypeOrmModule],
})
export class CardsModule {}
