import { Repository } from 'typeorm';
import { GetProductAccountAllHandler } from './getProductAll.handler';
import { AccountProduct } from '../entities/account-product.entity';

describe('GetProductAccountAllHandler', () => {
  it('returns only enabled products with the public projection', async () => {
    const products = [
      {
        code: 'CA-ARS-CLASSIC',
        name: 'Caja de ahorro clasica',
        accountType: 'SAVINGS',
        tierCode: 'CLASSIC',
        currency: 'ARS',
        dailyTransferLimitMinor: '100000',
        dailyWithdrawalLimitMinor: '50000',
        maintenanceFeeMinor: '0',
        allowsOverdraft: false,
      },
    ];
    const find = jest.fn().mockResolvedValue(products);
    const handler = new GetProductAccountAllHandler({ find } as unknown as Repository<AccountProduct>);

    await expect(handler.execute()).resolves.toEqual(products);
    expect(find).toHaveBeenCalledWith({
      select: {
        code: true,
        name: true,
        accountType: true,
        tierCode: true,
        currency: true,
        dailyTransferLimitMinor: true,
        dailyWithdrawalLimitMinor: true,
        maintenanceFeeMinor: true,
        allowsOverdraft: true,
      },
      where: { enabled: true },
    });
  });
});
