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
    'SELECT * FROM trips WHERE startDate <= ? AND endDate >= ? ORDER BY startDate DESC',
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
