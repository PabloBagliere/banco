import { QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { AccountProductsController } from './account-products.controller';
import { GetProductAccountAllQuery } from './query/get-product-account-all.query';

describe('AccountProductsController', () => {
  it('dispatches the active products query', async () => {
    const execute = jest.fn().mockResolvedValue([]);
    const module = await Test.createTestingModule({
      controllers: [AccountProductsController],
      providers: [{ provide: QueryBus, useValue: { execute } }],
    }).compile();
    const controller = module.get(AccountProductsController);

    await expect(controller.getActiveProducts()).resolves.toEqual([]);
    expect(execute).toHaveBeenCalledWith(expect.any(GetProductAccountAllQuery));
  });
});
