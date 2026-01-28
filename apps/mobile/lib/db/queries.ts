// Travel Helper v1.1 - Database Queries (Simplified)
// PRD v1.1 기준 - 지갑/환전 기능 제외

import { getDatabase } from './schema';
import { Trip, Destination, Expense, ExchangeRateCache } from '../types';

// ============ TRIPS ============

export async function getAllTrips(): Promise<Trip[]> {
  const db = await getDatabase();
  const result = await db.getAllAsync<Trip>('SELECT * FROM trips ORDER BY startDate DESC');
  return result;
}

export async function getTripById(id: string): Promise<Trip | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<Trip>('SELECT * FROM trips WHERE id = ?', [id]);
  return result || null;
}

export async function getActiveTrips(): Promise<Trip[]> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const result = await db.getAllAsync<Trip>(
    'SELECT * FROM trips WHERE startDate <= ? AND endDate >= ? ORDER BY createdAt DESC',
    [today, today]
  );
  return result;
}

export async function createTrip(trip: Trip): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO trips (id, name, startDate, endDate, budget, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    [trip.id, trip.name, trip.startDate, trip.endDate, trip.budget ?? null, trip.createdAt]
  );
}

export async function updateTrip(trip: Trip): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE trips SET name = ?, startDate = ?, endDate = ?, budget = ? WHERE id = ?',
    [trip.name, trip.startDate, trip.endDate, trip.budget ?? null, trip.id]
  );
}

export async function deleteTrip(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM expenses WHERE tripId = ?', [id]);
  await db.runAsync('DELETE FROM destinations WHERE tripId = ?', [id]);
  await db.runAsync('DELETE FROM trips WHERE id = ?', [id]);
}

// ============ DESTINATIONS ============

export async function getDestinationsByTripId(tripId: string): Promise<Destination[]> {
  const db = await getDatabase();
  const result = await db.getAllAsync<Destination>(
    'SELECT * FROM destinations WHERE tripId = ? ORDER BY orderIndex ASC',
    [tripId]
  );
  return result;
}

export async function getDestinationById(id: string): Promise<Destination | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<Destination>('SELECT * FROM destinations WHERE id = ?', [id]);
  return result || null;
}

export async function createDestination(destination: Destination): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO destinations (id, tripId, country, countryName, currency, startDate, endDate, orderIndex, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      destination.id,
      destination.tripId,
      destination.country,
      destination.countryName ?? null,
      destination.currency,
      destination.startDate ?? null,
      destination.endDate ?? null,
      destination.orderIndex,
      destination.createdAt,
    ]
  );
}

export async function updateDestination(destination: Destination): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE destinations SET country = ?, countryName = ?, currency = ?, startDate = ?, endDate = ?, orderIndex = ? WHERE id = ?`,
    [
      destination.country,
      destination.countryName ?? null,
      destination.currency,
      destination.startDate ?? null,
      destination.endDate ?? null,
      destination.orderIndex,
      destination.id,
    ]
  );
}

export async function deleteDestination(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM destinations WHERE id = ?', [id]);
}

// 현재 날짜 기준으로 해당 여행의 현재 방문지 조회
export async function getCurrentDestination(tripId: string): Promise<Destination | null> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const result = await db.getFirstAsync<Destination>(
    `SELECT * FROM destinations
     WHERE tripId = ? AND startDate <= ? AND endDate >= ?
     ORDER BY orderIndex ASC LIMIT 1`,
    [tripId, today, today]
  );
  if (result) return result;

  // 날짜 범위 내 방문지가 없으면 첫 번째 방문지 반환
  const firstDest = await db.getFirstAsync<Destination>(
    'SELECT * FROM destinations WHERE tripId = ? ORDER BY orderIndex ASC LIMIT 1',
    [tripId]
  );
  return firstDest || null;
}

// ============ EXPENSES ============

export async function getExpensesByTripId(tripId: string): Promise<Expense[]> {
  const db = await getDatabase();
  const result = await db.getAllAsync<Expense>(
    'SELECT * FROM expenses WHERE tripId = ? ORDER BY date DESC, createdAt DESC',
    [tripId]
  );
  return result;
}

export async function getExpensesByDate(tripId: string, date: string): Promise<Expense[]> {
  const db = await getDatabase();
  const result = await db.getAllAsync<Expense>(
    'SELECT * FROM expenses WHERE tripId = ? AND date = ? ORDER BY createdAt DESC',
    [tripId, date]
  );
  return result;
}

export async function getExpensesByDestination(destinationId: string): Promise<Expense[]> {
  const db = await getDatabase();
  const result = await db.getAllAsync<Expense>(
    'SELECT * FROM expenses WHERE destinationId = ? ORDER BY date DESC, createdAt DESC',
    [destinationId]
  );
  return result;
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<Expense>('SELECT * FROM expenses WHERE id = ?', [id]);
  return result || null;
}

export async function createExpense(expense: Expense): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO expenses (id, tripId, destinationId, amount, currency, amountKRW, exchangeRate, category, memo, date, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      expense.id,
      expense.tripId,
      expense.destinationId ?? null,
      expense.amount,
      expense.currency,
      expense.amountKRW,
      expense.exchangeRate,
      expense.category,
      expense.memo ?? null,
      expense.date,
      expense.createdAt,
    ]
  );
}

export async function updateExpense(expense: Expense): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE expenses SET destinationId = ?, amount = ?, currency = ?, amountKRW = ?, exchangeRate = ?,
     category = ?, memo = ?, date = ? WHERE id = ?`,
    [
      expense.destinationId ?? null,
      expense.amount,
      expense.currency,
      expense.amountKRW,
      expense.exchangeRate,
      expense.category,
      expense.memo ?? null,
      expense.date,
      expense.id,
    ]
  );
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

export async function getTotalExpenseByTrip(tripId: string): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amountKRW), 0) as total FROM expenses WHERE tripId = ?',
    [tripId]
  );
  return result?.total ?? 0;
}

export async function getTodayExpenseByTrip(tripId: string): Promise<{ totalKRW: number; byCurrency: Record<string, number> }> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];

  const totalResult = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amountKRW), 0) as total FROM expenses WHERE tripId = ? AND date = ?',
    [tripId, today]
  );

  const byCurrencyResult = await db.getAllAsync<{ currency: string; total: number }>(
    'SELECT currency, COALESCE(SUM(amount), 0) as total FROM expenses WHERE tripId = ? AND date = ? GROUP BY currency',
    [tripId, today]
  );

  const byCurrency: Record<string, number> = {};
  for (const row of byCurrencyResult) {
    byCurrency[row.currency] = row.total;
  }

  return {
    totalKRW: totalResult?.total ?? 0,
    byCurrency,
  };
}

// 통화별 총 지출
export async function getExpensesByCurrency(tripId: string): Promise<Record<string, { amount: number; amountKRW: number }>> {
  const db = await getDatabase();
  const result = await db.getAllAsync<{ currency: string; totalAmount: number; totalKRW: number }>(
    `SELECT currency, SUM(amount) as totalAmount, SUM(amountKRW) as totalKRW
     FROM expenses WHERE tripId = ? GROUP BY currency`,
    [tripId]
  );

  const byCurrency: Record<string, { amount: number; amountKRW: number }> = {};
  for (const row of result) {
    byCurrency[row.currency] = { amount: row.totalAmount, amountKRW: row.totalKRW };
  }
  return byCurrency;
}

// 날짜별 지출 합계 (캘린더용)
export async function getExpensesByDateRange(tripId: string, startDate: string, endDate: string): Promise<Record<string, number>> {
  const db = await getDatabase();
  const result = await db.getAllAsync<{ date: string; total: number }>(
    `SELECT date, SUM(amountKRW) as total FROM expenses
     WHERE tripId = ? AND date >= ? AND date <= ?
     GROUP BY date`,
    [tripId, startDate, endDate]
  );

  const byDate: Record<string, number> = {};
  for (const row of result) {
    byDate[row.date] = row.total;
  }
  return byDate;
}

// ============ EXCHANGE RATES ============

export async function getExchangeRates(): Promise<ExchangeRateCache | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ rates: string; lastUpdated: string }>(
    'SELECT rates, lastUpdated FROM exchange_rates ORDER BY id DESC LIMIT 1'
  );
  if (!result) return null;
  return {
    rates: JSON.parse(result.rates),
    lastUpdated: result.lastUpdated,
  };
}

export async function saveExchangeRates(cache: ExchangeRateCache): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM exchange_rates');
  await db.runAsync(
    'INSERT INTO exchange_rates (rates, lastUpdated) VALUES (?, ?)',
    [JSON.stringify(cache.rates), cache.lastUpdated]
  );
}

// ============ DATA MANAGEMENT ============

// 로그인 시 모든 로컬 데이터 삭제 (서버 데이터만 사용)
export async function deleteAllLocalData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM sync_queue;
    DELETE FROM sync_metadata;
    DELETE FROM expenses;
    DELETE FROM destinations;
    DELETE FROM trips;
  `);
}

// ============ SYNC QUEUE ============

export interface SyncQueueItem {
  id: number;
  entityType: 'trip' | 'destination' | 'expense';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  localUpdatedAt: string;
  createdAt: string;
}

export async function addToSyncQueue(
  entityType: 'trip' | 'destination' | 'expense',
  entityId: string,
  action: 'create' | 'update' | 'delete',
  data: Record<string, unknown>
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO sync_queue (entityType, entityId, action, data, localUpdatedAt, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [entityType, entityId, action, JSON.stringify(data), now, now]
  );
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDatabase();
  const result = await db.getAllAsync<{
    id: number;
    entityType: string;
    entityId: string;
    action: string;
    data: string;
    localUpdatedAt: string;
    createdAt: string;
  }>('SELECT * FROM sync_queue ORDER BY createdAt ASC');

  return result.map((item) => ({
    id: item.id,
    entityType: item.entityType as 'trip' | 'destination' | 'expense',
    entityId: item.entityId,
    action: item.action as 'create' | 'update' | 'delete',
    data: JSON.parse(item.data),
    localUpdatedAt: item.localUpdatedAt,
    createdAt: item.createdAt,
  }));
}

export async function clearSyncQueue(entityIds?: string[]): Promise<void> {
  const db = await getDatabase();
  if (entityIds && entityIds.length > 0) {
    const placeholders = entityIds.map(() => '?').join(',');
    await db.runAsync(
      `DELETE FROM sync_queue WHERE entityId IN (${placeholders})`,
      entityIds
    );
  } else {
    await db.runAsync('DELETE FROM sync_queue');
  }
}

export async function getSyncQueueCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM sync_queue'
  );
  return result?.count ?? 0;
}

// ============ SYNC METADATA ============

export async function getLastSyncedAt(): Promise<string | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM sync_metadata WHERE key = 'lastSyncedAt'"
  );
  return result?.value || null;
}

export async function setLastSyncedAt(timestamp: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO sync_metadata (key, value) VALUES ('lastSyncedAt', ?)`,
    [timestamp]
  );
}

// ============ UPSERT (for sync) ============

export async function upsertTrip(trip: Trip): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO trips (id, name, startDate, endDate, budget, createdAt, syncStatus, serverUpdatedAt)
     VALUES (?, ?, ?, ?, ?, ?, 'synced', ?)`,
    [
      trip.id,
      trip.name,
      trip.startDate,
      trip.endDate,
      trip.budget ?? null,
      trip.createdAt,
      new Date().toISOString(),
    ]
  );
}

export async function upsertDestination(destination: Destination): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO destinations (id, tripId, country, countryName, currency, startDate, endDate, orderIndex, createdAt, syncStatus, serverUpdatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
    [
      destination.id,
      destination.tripId,
      destination.country,
      destination.countryName ?? null,
      destination.currency,
      destination.startDate ?? null,
      destination.endDate ?? null,
      destination.orderIndex,
      destination.createdAt,
      new Date().toISOString(),
    ]
  );
}

export async function upsertExpense(expense: Expense): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO expenses (id, tripId, destinationId, amount, currency, amountKRW, exchangeRate, category, memo, date, createdAt, syncStatus, serverUpdatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
    [
      expense.id,
      expense.tripId,
      expense.destinationId ?? null,
      expense.amount,
      expense.currency,
      expense.amountKRW,
      expense.exchangeRate,
      expense.category,
      expense.memo ?? null,
      expense.date,
      expense.createdAt,
      new Date().toISOString(),
    ]
  );
}

// ============ SYNC STATUS UPDATE ============

export type SyncStatus = 'pending' | 'synced' | 'conflict';

export async function updateTripSyncStatus(
  id: string,
  syncStatus: SyncStatus,
  serverUpdatedAt?: string
): Promise<void> {
  const db = await getDatabase();
  if (serverUpdatedAt) {
    await db.runAsync(
      'UPDATE trips SET syncStatus = ?, serverUpdatedAt = ? WHERE id = ?',
      [syncStatus, serverUpdatedAt, id]
    );
  } else {
    await db.runAsync('UPDATE trips SET syncStatus = ? WHERE id = ?', [
      syncStatus,
      id,
    ]);
  }
}

export async function updateDestinationSyncStatus(
  id: string,
  syncStatus: SyncStatus,
  serverUpdatedAt?: string
): Promise<void> {
  const db = await getDatabase();
  if (serverUpdatedAt) {
    await db.runAsync(
      'UPDATE destinations SET syncStatus = ?, serverUpdatedAt = ? WHERE id = ?',
      [syncStatus, serverUpdatedAt, id]
    );
  } else {
    await db.runAsync('UPDATE destinations SET syncStatus = ? WHERE id = ?', [
      syncStatus,
      id,
    ]);
  }
}

export async function updateExpenseSyncStatus(
  id: string,
  syncStatus: SyncStatus,
  serverUpdatedAt?: string
): Promise<void> {
  const db = await getDatabase();
  if (serverUpdatedAt) {
    await db.runAsync(
      'UPDATE expenses SET syncStatus = ?, serverUpdatedAt = ? WHERE id = ?',
      [syncStatus, serverUpdatedAt, id]
    );
  } else {
    await db.runAsync('UPDATE expenses SET syncStatus = ? WHERE id = ?', [
      syncStatus,
      id,
    ]);
  }
}
