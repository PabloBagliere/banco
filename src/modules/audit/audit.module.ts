import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditEvent } from './entities/audit-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditEvent])],
  exports: [TypeOrmModule],
})
export class AuditModule {}
