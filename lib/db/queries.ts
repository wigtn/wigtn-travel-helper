import { getDatabase } from './schema';
import { Trip, Expense, ExchangeRateCache } from '../types';

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

export async function getActiveTrip(): Promise<Trip | null> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const result = await db.getFirstAsync<Trip>(
    'SELECT * FROM trips WHERE startDate <= ? AND endDate >= ? ORDER BY startDate DESC LIMIT 1',
    [today, today]
  );
  return result || null;
}

export async function createTrip(trip: Trip): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO trips (id, name, country, currency, startDate, endDate, budget, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [trip.id, trip.name, trip.country, trip.currency, trip.startDate, trip.endDate, trip.budget ?? null, trip.createdAt]
  );
}

export async function updateTrip(trip: Trip): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE trips SET name = ?, country = ?, currency = ?, startDate = ?, endDate = ?, budget = ? WHERE id = ?',
    [trip.name, trip.country, trip.currency, trip.startDate, trip.endDate, trip.budget ?? null, trip.id]
  );
}

export async function deleteTrip(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM expenses WHERE tripId = ?', [id]);
  await db.runAsync('DELETE FROM trips WHERE id = ?', [id]);
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

export async function createExpense(expense: Expense): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO expenses (id, tripId, amount, currency, amountKRW, exchangeRate, category, memo, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      expense.id,
      expense.tripId,
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
    'UPDATE expenses SET amount = ?, currency = ?, amountKRW = ?, exchangeRate = ?, category = ?, memo = ?, date = ? WHERE id = ?',
    [expense.amount, expense.currency, expense.amountKRW, expense.exchangeRate, expense.category, expense.memo ?? null, expense.date, expense.id]
  );
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

export async function getTotalExpenseByTrip(tripId: string): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ total: number }>('SELECT COALESCE(SUM(amountKRW), 0) as total FROM expenses WHERE tripId = ?', [tripId]);
  return result?.total ?? 0;
}

export async function getTodayExpenseByTrip(tripId: string): Promise<number> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const result = await db.getFirstAsync<{ total: number }>('SELECT COALESCE(SUM(amountKRW), 0) as total FROM expenses WHERE tripId = ? AND date = ?', [tripId, today]);
  return result?.total ?? 0;
}

// ============ EXCHANGE RATES ============

export async function getExchangeRates(): Promise<ExchangeRateCache | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ rates: string; lastUpdated: string }>('SELECT rates, lastUpdated FROM exchange_rates ORDER BY id DESC LIMIT 1');
  if (!result) return null;
  return {
    rates: JSON.parse(result.rates),
    lastUpdated: result.lastUpdated,
  };
}

export async function saveExchangeRates(cache: ExchangeRateCache): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM exchange_rates');
  await db.runAsync('INSERT INTO exchange_rates (rates, lastUpdated) VALUES (?, ?)', [JSON.stringify(cache.rates), cache.lastUpdated]);
}
