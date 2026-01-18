import * as SQLite from 'expo-sqlite';

const DB_NAME = 'travel_expense.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await initDatabase(db);
  return db;
}

async function initDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      currency TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      budget REAL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      tripId TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      amountKRW REAL NOT NULL,
      exchangeRate REAL NOT NULL,
      category TEXT NOT NULL,
      memo TEXT,
      date TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rates TEXT NOT NULL,
      lastUpdated TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_tripId ON expenses(tripId);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
  `);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
