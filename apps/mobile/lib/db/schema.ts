// Travel Helper v1.1 - Database Schema (Simplified)
// PRD v1.1 기준 - 지갑/환전 기능 제외

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'travel_expense_v1_1.db';

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
    PRAGMA foreign_keys = ON;

    -- 여행 테이블
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      budget REAL,
      createdAt TEXT NOT NULL
    );

    -- 방문지 테이블 (다중 국가 지원)
    CREATE TABLE IF NOT EXISTS destinations (
      id TEXT PRIMARY KEY,
      tripId TEXT NOT NULL,
      country TEXT NOT NULL,
      countryName TEXT,
      currency TEXT NOT NULL,
      startDate TEXT,
      endDate TEXT,
      orderIndex INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_destinations_tripId ON destinations(tripId);

    -- 지출 테이블
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      tripId TEXT NOT NULL,
      destinationId TEXT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      amountKRW REAL NOT NULL,
      exchangeRate REAL NOT NULL,
      category TEXT NOT NULL,
      memo TEXT,
      date TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (destinationId) REFERENCES destinations(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_tripId ON expenses(tripId);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_expenses_destinationId ON expenses(destinationId);

    -- 환율 캐시 테이블
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rates TEXT NOT NULL,
      lastUpdated TEXT NOT NULL
    );
  `);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
