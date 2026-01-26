import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsIn,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SyncPushDto as ISyncPushDto,
  SyncChange as ISyncChange,
  SyncResolveConflictDto as ISyncResolveConflictDto,
  MigrationUploadDto as IMigrationUploadDto,
  SyncEntityType,
} from '@wigtn/shared';

const SYNC_ENTITY_TYPES = ['trip', 'destination', 'expense'] as const;
const SYNC_ACTIONS = ['create', 'update', 'delete'] as const;
const CONFLICT_RESOLUTIONS = ['keep_local', 'keep_server'] as const;

export class SyncChangeDto implements ISyncChange {
  @ApiProperty({ enum: SYNC_ENTITY_TYPES })
  @IsIn(SYNC_ENTITY_TYPES)
  entityType: SyncEntityType;

  @ApiProperty()
  @IsString()
  entityId: string;

  @ApiProperty({ enum: SYNC_ACTIONS })
  @IsIn(SYNC_ACTIONS)
  action: 'create' | 'update' | 'delete';

  @ApiProperty({ type: Object, additionalProperties: true })
  data: Record<string, unknown>;

  @ApiProperty()
  @IsDateString()
  localUpdatedAt: string;
}

export class SyncPushDto implements ISyncPushDto {
  @ApiProperty({ type: [SyncChangeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncChangeDto)
  changes: SyncChangeDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  lastSyncedAt?: string;
}

export class SyncResolveConflictDto implements ISyncResolveConflictDto {
  @ApiProperty({ enum: SYNC_ENTITY_TYPES })
  @IsIn(SYNC_ENTITY_TYPES)
  entityType: SyncEntityType;

  @ApiProperty()
  @IsString()
  entityId: string;

  @ApiProperty({ enum: CONFLICT_RESOLUTIONS })
  @IsIn(CONFLICT_RESOLUTIONS)
  resolution: 'keep_local' | 'keep_server';
}

export class MigrationUploadDto implements IMigrationUploadDto {
  @ApiProperty({ type: 'array', items: { type: 'object', additionalProperties: true } })
  @IsArray()
  trips: Record<string, unknown>[];

  @ApiProperty({ type: 'array', items: { type: 'object', additionalProperties: true } })
  @IsArray()
  destinations: Record<string, unknown>[];

  @ApiProperty({ type: 'array', items: { type: 'object', additionalProperties: true } })
  @IsArray()
  expenses: Record<string, unknown>[];
}

export class SyncPullQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  lastSyncedAt?: string;
}
