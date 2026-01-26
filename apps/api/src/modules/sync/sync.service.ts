import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  SyncPushDto,
  SyncResolveConflictDto,
  MigrationUploadDto,
  SyncChangeDto,
} from './dto/sync.dto';
import {
  SyncPushResponse,
  SyncConflict,
  SyncChange,
  MigrationUploadResponse,
} from '@wigtn/shared';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async push(userId: string, dto: SyncPushDto): Promise<SyncPushResponse> {
    const applied: string[] = [];
    const conflicts: SyncConflict[] = [];
    const serverChanges: SyncChange[] = [];

    for (const change of dto.changes) {
      try {
        const result = await this.processChange(userId, change);
        if (result.success) {
          applied.push(change.entityId);
        } else if (result.conflict) {
          conflicts.push(result.conflict);
        }
      } catch (error) {
        this.logger.error(`Failed to process change for ${change.entityId}:`, error);
      }
    }

    // Get server changes since lastSyncedAt
    if (dto.lastSyncedAt) {
      const changes = await this.getServerChanges(userId, new Date(dto.lastSyncedAt));
      serverChanges.push(...changes);
    }

    return {
      applied,
      conflicts,
      serverChanges,
      syncedAt: new Date().toISOString(),
    };
  }

  async pull(userId: string, lastSyncedAt?: string): Promise<SyncPushResponse> {
    const serverChanges: SyncChange[] = [];

    if (lastSyncedAt) {
      const changes = await this.getServerChanges(userId, new Date(lastSyncedAt));
      serverChanges.push(...changes);
    } else {
      // First sync - return all data
      const allChanges = await this.getAllUserData(userId);
      serverChanges.push(...allChanges);
    }

    return {
      applied: [],
      conflicts: [],
      serverChanges,
      syncedAt: new Date().toISOString(),
    };
  }

  async resolveConflict(
    userId: string,
    dto: SyncResolveConflictDto,
  ): Promise<{ success: boolean; message: string }> {
    const { entityType, entityId, resolution } = dto;

    if (resolution === 'keep_local') {
      // This should be handled by client re-sending the change
      // Here we just acknowledge it
      return { success: true, message: 'Conflict resolved - keep local' };
    }

    // keep_server: No action needed, server data is already in place
    return { success: true, message: 'Conflict resolved - keep server' };
  }

  async migrate(userId: string, dto: MigrationUploadDto): Promise<MigrationUploadResponse> {
    const imported = { trips: 0, destinations: 0, expenses: 0 };
    const conflicts: SyncConflict[] = [];

    // Use transaction for atomicity
    await this.prisma.$transaction(async (tx) => {
      // Import trips
      for (const tripData of dto.trips) {
        try {
          const existing = await tx.trip.findFirst({
            where: {
              userId,
              name: tripData.name as string,
              startDate: new Date(tripData.startDate as string),
            },
          });

          if (existing) {
            conflicts.push({
              entityType: 'trip',
              entityId: tripData.id as string,
              localData: tripData,
              serverData: existing as unknown as Record<string, unknown>,
              localUpdatedAt: tripData.updatedAt as string || tripData.createdAt as string,
              serverUpdatedAt: existing.updatedAt.toISOString(),
            });
            continue;
          }

          await tx.trip.create({
            data: {
              id: tripData.id as string,
              userId,
              name: tripData.name as string,
              startDate: new Date(tripData.startDate as string),
              endDate: tripData.endDate ? new Date(tripData.endDate as string) : null,
              budget: tripData.budget as number || null,
              budgetCurrency: (tripData.budgetCurrency as string) || 'KRW',
              status: 'active',
            },
          });
          imported.trips++;
        } catch (error) {
          this.logger.error(`Failed to import trip ${tripData.id}:`, error);
        }
      }

      // Import destinations
      for (const destData of dto.destinations) {
        try {
          await tx.destination.create({
            data: {
              id: destData.id as string,
              tripId: destData.tripId as string,
              countryCode: (destData.countryCode as string) || 'XX',
              country: destData.country as string,
              city: destData.city as string || null,
              currency: destData.currency as string,
              startDate: destData.startDate ? new Date(destData.startDate as string) : null,
              endDate: destData.endDate ? new Date(destData.endDate as string) : null,
              orderIndex: (destData.orderIndex as number) || 0,
            },
          });
          imported.destinations++;
        } catch (error) {
          this.logger.error(`Failed to import destination ${destData.id}:`, error);
        }
      }

      // Import expenses
      for (const expenseData of dto.expenses) {
        try {
          await tx.expense.create({
            data: {
              id: expenseData.id as string,
              tripId: expenseData.tripId as string,
              userId,
              destinationId: expenseData.destinationId as string || null,
              amount: expenseData.amount as number,
              currency: expenseData.currency as string,
              exchangeRate: expenseData.exchangeRate as number,
              amountKRW: expenseData.amountKRW as number,
              category: expenseData.category as string,
              paymentMethod: (expenseData.paymentMethod as string) || 'card',
              description: expenseData.description as string || null,
              memo: expenseData.memo as string || null,
              expenseDate: new Date((expenseData.expenseDate || expenseData.date) as string),
              expenseTime: expenseData.expenseTime || expenseData.time
                ? new Date(`1970-01-01T${(expenseData.expenseTime || expenseData.time) as string}`)
                : null,
              ocrProcessed: false,
            },
          });
          imported.expenses++;
        } catch (error) {
          this.logger.error(`Failed to import expense ${expenseData.id}:`, error);
        }
      }
    });

    return {
      imported,
      conflicts,
      message: `Successfully imported ${imported.trips} trips, ${imported.destinations} destinations, ${imported.expenses} expenses`,
    };
  }

  private async processChange(
    userId: string,
    change: SyncChangeDto,
  ): Promise<{ success: boolean; conflict?: SyncConflict }> {
    const { entityType, entityId, action, data, localUpdatedAt } = change;

    switch (entityType) {
      case 'trip':
        return this.processTripChange(userId, entityId, action, data, localUpdatedAt);
      case 'destination':
        return this.processDestinationChange(userId, entityId, action, data, localUpdatedAt);
      case 'expense':
        return this.processExpenseChange(userId, entityId, action, data, localUpdatedAt);
      default:
        throw new BadRequestException(`Unknown entity type: ${entityType}`);
    }
  }

  private async processTripChange(
    userId: string,
    entityId: string,
    action: string,
    data: Record<string, unknown>,
    localUpdatedAt: string,
  ): Promise<{ success: boolean; conflict?: SyncConflict }> {
    const existing = await this.prisma.trip.findUnique({ where: { id: entityId } });

    if (action === 'create') {
      if (existing) {
        return {
          success: false,
          conflict: {
            entityType: 'trip',
            entityId,
            localData: data,
            serverData: existing as unknown as Record<string, unknown>,
            localUpdatedAt,
            serverUpdatedAt: existing.updatedAt.toISOString(),
          },
        };
      }
      await this.prisma.trip.create({
        data: {
          id: entityId,
          userId,
          name: data.name as string,
          startDate: new Date(data.startDate as string),
          endDate: data.endDate ? new Date(data.endDate as string) : null,
          budget: data.budget as number || null,
          budgetCurrency: (data.budgetCurrency as string) || 'KRW',
          status: 'active',
        },
      });
      return { success: true };
    }

    if (action === 'update') {
      if (!existing) {
        return { success: false };
      }
      if (existing.userId !== userId) {
        return { success: false };
      }
      // Check for conflict
      if (existing.updatedAt > new Date(localUpdatedAt)) {
        return {
          success: false,
          conflict: {
            entityType: 'trip',
            entityId,
            localData: data,
            serverData: existing as unknown as Record<string, unknown>,
            localUpdatedAt,
            serverUpdatedAt: existing.updatedAt.toISOString(),
          },
        };
      }
      await this.prisma.trip.update({
        where: { id: entityId },
        data: {
          name: data.name as string,
          startDate: data.startDate ? new Date(data.startDate as string) : undefined,
          endDate: data.endDate ? new Date(data.endDate as string) : undefined,
          budget: data.budget as number,
          status: data.status as string,
        },
      });
      return { success: true };
    }

    if (action === 'delete') {
      if (existing && existing.userId === userId) {
        await this.prisma.trip.delete({ where: { id: entityId } });
      }
      return { success: true };
    }

    return { success: false };
  }

  private async processDestinationChange(
    userId: string,
    entityId: string,
    action: string,
    data: Record<string, unknown>,
    localUpdatedAt: string,
  ): Promise<{ success: boolean; conflict?: SyncConflict }> {
    if (action === 'create') {
      const tripId = data.tripId as string;
      const trip = await this.prisma.trip.findFirst({ where: { id: tripId, userId } });
      if (!trip) {
        return { success: false };
      }
      await this.prisma.destination.create({
        data: {
          id: entityId,
          tripId,
          countryCode: (data.countryCode as string) || 'XX',
          country: data.country as string,
          city: data.city as string || null,
          currency: data.currency as string,
          startDate: data.startDate ? new Date(data.startDate as string) : null,
          endDate: data.endDate ? new Date(data.endDate as string) : null,
          orderIndex: (data.orderIndex as number) || 0,
        },
      });
      return { success: true };
    }

    if (action === 'update') {
      const existing = await this.prisma.destination.findUnique({
        where: { id: entityId },
        include: { trip: true },
      });
      if (!existing || existing.trip.userId !== userId) {
        return { success: false };
      }
      if (existing.updatedAt > new Date(localUpdatedAt)) {
        return {
          success: false,
          conflict: {
            entityType: 'destination',
            entityId,
            localData: data,
            serverData: existing as unknown as Record<string, unknown>,
            localUpdatedAt,
            serverUpdatedAt: existing.updatedAt.toISOString(),
          },
        };
      }
      await this.prisma.destination.update({
        where: { id: entityId },
        data: {
          countryCode: data.countryCode as string,
          country: data.country as string,
          city: data.city as string,
          currency: data.currency as string,
          orderIndex: data.orderIndex as number,
        },
      });
      return { success: true };
    }

    if (action === 'delete') {
      const existing = await this.prisma.destination.findUnique({
        where: { id: entityId },
        include: { trip: true },
      });
      if (existing && existing.trip.userId === userId) {
        await this.prisma.destination.delete({ where: { id: entityId } });
      }
      return { success: true };
    }

    return { success: false };
  }

  private async processExpenseChange(
    userId: string,
    entityId: string,
    action: string,
    data: Record<string, unknown>,
    localUpdatedAt: string,
  ): Promise<{ success: boolean; conflict?: SyncConflict }> {
    if (action === 'create') {
      const tripId = data.tripId as string;
      const trip = await this.prisma.trip.findFirst({ where: { id: tripId, userId } });
      if (!trip) {
        return { success: false };
      }
      await this.prisma.expense.create({
        data: {
          id: entityId,
          tripId,
          userId,
          destinationId: data.destinationId as string || null,
          amount: data.amount as number,
          currency: data.currency as string,
          exchangeRate: data.exchangeRate as number,
          amountKRW: data.amountKRW as number,
          category: data.category as string,
          paymentMethod: (data.paymentMethod as string) || 'card',
          description: data.description as string || null,
          memo: data.memo as string || null,
          expenseDate: new Date((data.expenseDate || data.date) as string),
          expenseTime: data.expenseTime || data.time
            ? new Date(`1970-01-01T${(data.expenseTime || data.time) as string}`)
            : null,
          ocrProcessed: false,
        },
      });
      return { success: true };
    }

    if (action === 'update') {
      const existing = await this.prisma.expense.findUnique({ where: { id: entityId } });
      if (!existing || existing.userId !== userId) {
        return { success: false };
      }
      if (existing.updatedAt > new Date(localUpdatedAt)) {
        return {
          success: false,
          conflict: {
            entityType: 'expense',
            entityId,
            localData: data,
            serverData: existing as unknown as Record<string, unknown>,
            localUpdatedAt,
            serverUpdatedAt: existing.updatedAt.toISOString(),
          },
        };
      }
      await this.prisma.expense.update({
        where: { id: entityId },
        data: {
          amount: data.amount as number,
          currency: data.currency as string,
          exchangeRate: data.exchangeRate as number,
          amountKRW: data.amountKRW as number,
          category: data.category as string,
          paymentMethod: data.paymentMethod as string,
          description: data.description as string,
          memo: data.memo as string,
          expenseDate: data.expenseDate ? new Date(data.expenseDate as string) : undefined,
        },
      });
      return { success: true };
    }

    if (action === 'delete') {
      const existing = await this.prisma.expense.findUnique({ where: { id: entityId } });
      if (existing && existing.userId === userId) {
        await this.prisma.expense.delete({ where: { id: entityId } });
      }
      return { success: true };
    }

    return { success: false };
  }

  private async getServerChanges(userId: string, since: Date): Promise<SyncChange[]> {
    const changes: SyncChange[] = [];

    // Get updated trips
    const trips = await this.prisma.trip.findMany({
      where: { userId, updatedAt: { gt: since } },
    });
    for (const trip of trips) {
      changes.push({
        entityType: 'trip',
        entityId: trip.id,
        action: 'update',
        data: trip as unknown as Record<string, unknown>,
        localUpdatedAt: trip.updatedAt.toISOString(),
      });
    }

    // Get updated destinations
    const destinations = await this.prisma.destination.findMany({
      where: { trip: { userId }, updatedAt: { gt: since } },
    });
    for (const dest of destinations) {
      changes.push({
        entityType: 'destination',
        entityId: dest.id,
        action: 'update',
        data: dest as unknown as Record<string, unknown>,
        localUpdatedAt: dest.updatedAt.toISOString(),
      });
    }

    // Get updated expenses
    const expenses = await this.prisma.expense.findMany({
      where: { userId, updatedAt: { gt: since } },
    });
    for (const expense of expenses) {
      changes.push({
        entityType: 'expense',
        entityId: expense.id,
        action: 'update',
        data: expense as unknown as Record<string, unknown>,
        localUpdatedAt: expense.updatedAt.toISOString(),
      });
    }

    return changes;
  }

  private async getAllUserData(userId: string): Promise<SyncChange[]> {
    const changes: SyncChange[] = [];

    const trips = await this.prisma.trip.findMany({ where: { userId } });
    for (const trip of trips) {
      changes.push({
        entityType: 'trip',
        entityId: trip.id,
        action: 'create',
        data: trip as unknown as Record<string, unknown>,
        localUpdatedAt: trip.updatedAt.toISOString(),
      });
    }

    const destinations = await this.prisma.destination.findMany({
      where: { trip: { userId } },
    });
    for (const dest of destinations) {
      changes.push({
        entityType: 'destination',
        entityId: dest.id,
        action: 'create',
        data: dest as unknown as Record<string, unknown>,
        localUpdatedAt: dest.updatedAt.toISOString(),
      });
    }

    const expenses = await this.prisma.expense.findMany({ where: { userId } });
    for (const expense of expenses) {
      changes.push({
        entityType: 'expense',
        entityId: expense.id,
        action: 'create',
        data: expense as unknown as Record<string, unknown>,
        localUpdatedAt: expense.updatedAt.toISOString(),
      });
    }

    return changes;
  }
}
