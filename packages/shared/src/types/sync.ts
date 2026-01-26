// @wigtn/shared - Sync Types
// Data Schema Contract SSOT

/** 동기화 상태 */
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'error';

/** 동기화 대상 엔티티 종류 */
export type SyncEntityType = 'trip' | 'destination' | 'expense';

/** 개별 변경 사항 */
export interface SyncChange {
  entityType: SyncEntityType;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>; // 엔티티 데이터
  localUpdatedAt: string;     // 로컬 수정 시간
}

/** 동기화 요청 (Mobile → Backend) */
export interface SyncPushDto {
  changes: SyncChange[];
  lastSyncedAt?: string;      // 마지막 동기화 시점
}

/** 동기화 응답 (Backend → Mobile) */
export interface SyncPushResponse {
  applied: string[];           // 성공적으로 적용된 entityId[]
  conflicts: SyncConflict[];   // 충돌 목록
  serverChanges: SyncChange[]; // 서버에서 변경된 항목 (pull)
  syncedAt: string;            // 동기화 완료 시점
}

/** 충돌 정보 */
export interface SyncConflict {
  entityType: SyncEntityType;
  entityId: string;
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  localUpdatedAt: string;
  serverUpdatedAt: string;
}

/** 충돌 해결 요청 */
export interface SyncResolveConflictDto {
  entityType: SyncEntityType;
  entityId: string;
  resolution: 'keep_local' | 'keep_server';
}

/** 초기 마이그레이션 요청 (오프라인 데이터 → 서버) */
export interface MigrationUploadDto {
  trips: Record<string, unknown>[];
  destinations: Record<string, unknown>[];
  expenses: Record<string, unknown>[];
}

/** 초기 마이그레이션 응답 */
export interface MigrationUploadResponse {
  imported: {
    trips: number;
    destinations: number;
    expenses: number;
  };
  conflicts: SyncConflict[];
  message: string;
}
