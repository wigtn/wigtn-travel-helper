import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  SyncPushDto,
  SyncResolveConflictDto,
  MigrationUploadDto,
  SyncPullQueryDto,
} from './dto/sync.dto';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

@ApiTags('sync')
@Controller('sync')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Push local changes to server' })
  @ApiResponse({ status: 200, description: 'Changes synced' })
  async push(@Req() req: AuthenticatedRequest, @Body() dto: SyncPushDto) {
    const result = await this.syncService.push(req.user.id, dto);
    return { success: true, data: result };
  }

  @Get('pull')
  @ApiOperation({ summary: 'Pull server changes' })
  @ApiResponse({ status: 200, description: 'Server changes retrieved' })
  async pull(@Req() req: AuthenticatedRequest, @Query() query: SyncPullQueryDto) {
    const result = await this.syncService.pull(req.user.id, query.lastSyncedAt);
    return { success: true, data: result };
  }

  @Post('resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve sync conflict' })
  @ApiResponse({ status: 200, description: 'Conflict resolved' })
  async resolve(@Req() req: AuthenticatedRequest, @Body() dto: SyncResolveConflictDto) {
    const result = await this.syncService.resolveConflict(req.user.id, dto);
    return { success: true, data: result };
  }

  @Post('migrate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Migrate offline data to server' })
  @ApiResponse({ status: 200, description: 'Data migrated' })
  async migrate(@Req() req: AuthenticatedRequest, @Body() dto: MigrationUploadDto) {
    const result = await this.syncService.migrate(req.user.id, dto);
    return { success: true, data: result };
  }
}
