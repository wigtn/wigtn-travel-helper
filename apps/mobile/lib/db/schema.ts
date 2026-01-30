// Travel Helper v2.0 - Database Schema (with Sync Support)
// PRD v1.1 기준 - 지갑/환전 기능 제외, 동기화 지원 추가

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'travel_expense_v2_0.db';

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

    -- 여행 테이블 (with sync metadata)
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      budget REAL,
      createdAt TEXT NOT NULL,
      -- Sync metadata
      syncStatus TEXT DEFAULT 'synced',
      localUpdatedAt TEXT,
      serverUpdatedAt TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_trips_syncStatus ON trips(syncStatus);

    -- 방문지 테이블 (with sync metadata)
    CREATE TABLE IF NOT EXISTS destinations (
      id TEXT PRIMARY KEY,
      tripId TEXT NOT NULL,
      country TEXT NOT NULL,
      countryName TEXT,
      city TEXT,
      currency TEXT NOT NULL,
      startDate TEXT,
      endDate TEXT,
      orderIndex INTEGER DEFAULT 0,
      latitude REAL,
      longitude REAL,
      createdAt TEXT NOT NULL,
      -- Sync metadata
      syncStatus TEXT DEFAULT 'synced',
      localUpdatedAt TEXT,
      serverUpdatedAt TEXT,
      FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_destinations_tripId ON destinations(tripId);
    CREATE INDEX IF NOT EXISTS idx_destinations_syncStatus ON destinations(syncStatus);

    -- 지출 테이블 (with sync metadata)
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
      receiptId TEXT,
      inputMethod TEXT DEFAULT 'manual',
      createdAt TEXT NOT NULL,
      -- Sync metadata
      syncStatus TEXT DEFAULT 'synced',
      localUpdatedAt TEXT,
      serverUpdatedAt TEXT,
      FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (destinationId) REFERENCES destinations(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_tripId ON expenses(tripId);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_expenses_destinationId ON expenses(destinationId);
    CREATE INDEX IF NOT EXISTS idx_expenses_syncStatus ON expenses(syncStatus);

    -- 환율 캐시 테이블
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rates TEXT NOT NULL,
      lastUpdated TEXT NOT NULL
    );

    -- 동기화 큐 테이블 (오프라인 변경사항 추적)
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entityType TEXT NOT NULL,
      entityId TEXT NOT NULL,
      action TEXT NOT NULL,
      data TEXT NOT NULL,
      localUpdatedAt TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      UNIQUE(entityType, entityId, action)
    );

    CREATE INDEX IF NOT EXISTS idx_sync_queue_entityType ON sync_queue(entityType);

    -- 동기화 메타데이터 테이블
    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
