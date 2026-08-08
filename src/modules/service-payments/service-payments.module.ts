import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicePayment, ServiceProvider } from './entities/service-payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServicePayment, ServiceProvider])],
  exports: [TypeOrmModule],
})
export class ServicePaymentsModule {}
