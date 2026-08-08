import { randomInt } from 'node:crypto';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetProductAccountQuery } from '../../account-products/query/get-product-account.query';
import { OpenAccountCommand } from '../command/open-account.command';
import { BankAccount } from '../entities/bank-account.entity';

@CommandHandler(OpenAccountCommand)
export class OpenAccountHandler implements ICommandHandler<OpenAccountCommand> {
  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: OpenAccountCommand): Promise<BankAccount> {
    const { code, userId } = command;
    const product = await this.queryBus.execute(new GetProductAccountQuery(code));
    const resut = await this.bankAccountRepository.save({
      alias: this.generateAlias(),
      cbu: this.generateCBU(),
      productId: product.id,
      currency: product.currency,
      userId,
    });
    return resut;
  }
  private randomDigits(length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += randomInt(10);
    }
    return result;
  }
  private calculateCheckDigit(digits: string, weights: number[]): number {
    const sum = digits.split('').reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0);

    return (10 - (sum % 10)) % 10;
  }

  /**
   * Genera un CBU ficticio pero estructuralmente válido.
   *
   * CBU = 22 dígitos:
   * - 3 entidad
   * - 4 sucursal
   * - 1 dígito verificador
   * - 13 cuenta
   * - 1 dígito verificador
   */
  private generateCBU(): string {
    const bankAndBranch = this.randomDigits(7);

    const firstCheckDigit = this.calculateCheckDigit(bankAndBranch, [7, 1, 3, 9, 7, 1, 3]);

    // Segundo bloque: número de cuenta (13)
    const account = this.randomDigits(13);

    const secondCheckDigit = this.calculateCheckDigit(account, [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3]);

    return `${bankAndBranch}${firstCheckDigit}${account}${secondCheckDigit}`;
  }
  private randomItem<T>(items: T[]): T {
    return items[randomInt(items.length)];
  }

  private generateAlias(): string {
    const selected = new Set<string>();
    const WORDS = [
      'sol',
      'luna',
      'rio',
      'casa',
      'verde',
      'azul',
      'nube',
      'campo',
      'puma',
      'mate',
      'sur',
      'norte',
      'plata',
      'fuego',
      'aire',
      'monte',
      'lago',
      'cielo',
      'roble',
      'pampa',
      'tango',
      'cobre',
      'cedro',
      'mar',
    ];
    while (selected.size < 3) {
      selected.add(this.randomItem(WORDS));
    }

    return [...selected].join('.');
  }
}
