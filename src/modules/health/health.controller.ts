import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Public } from '../../common/decorator/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check API and database health' })
  @ApiOkResponse({ description: 'The API and database are healthy.' })
  @ApiServiceUnavailableResponse({ description: 'The API cannot reach a required dependency.' })
  check() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
