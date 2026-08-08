import { Command } from '@nestjs/cqrs';
import { BankAccount } from '../entities/bank-account.entity';

export class OpenAccountCommand extends Command<BankAccount> {
  constructor(
    public readonly code: string,
    public readonly userId: string,
  ) {
    super();
  }
}
