import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { OpenAccountCommand } from './command/open-account.command';
import { CreateAccountDto } from './dto/createAccount.dto';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import type { JwtAccessPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('account')
@Controller('accounts')
export class AccountsController {
  constructor(private commandBus: CommandBus) {}
  @Post('')
  resendVerificationEmail(@Body() createAccountDto: CreateAccountDto, @CurrentUser() user: JwtAccessPayload) {
    return this.commandBus.execute(new OpenAccountCommand(createAccountDto.code, user.sub));
  }
}
