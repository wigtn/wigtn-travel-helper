// @wigtn/shared - Common Types
// Data Schema Contract SSOT

/** 모든 엔티티의 기본 필드 */
export interface BaseEntity {
  id: string;                 // UUID v4
  createdAt: string;          // ISO 8601 (e.g., "2025-01-15T09:30:00.000Z")
  updatedAt?: string;         // ISO 8601
}

/** 페이지네이션 요청 */
export interface PaginationParams {
  page?: number;              // default: 1
  limit?: number;             // default: 20, max: 100
  sortBy?: string;            // 정렬 필드
  sortOrder?: 'asc' | 'desc'; // default: 'desc'
}

/** 페이지네이션 응답 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
