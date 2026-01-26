// @wigtn/shared - API Response Types
// Data Schema Contract SSOT

/** 성공 응답 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/** 에러 응답 */
export interface ApiError {
  success: false;
  error: {
    code: string;             // e.g., "VALIDATION_ERROR", "NOT_FOUND"
    message: string;          // 사용자 표시용
    details?: Record<string, unknown>; // 개발자용 상세
  };
}

/** API 결과 (성공 | 실패) */
export type ApiResult<T> = ApiResponse<T> | ApiError;

/** 표준 에러 코드 */
export type ErrorCode =
  | 'VALIDATION_ERROR'        // 400
  | 'UNAUTHORIZED'            // 401
  | 'FORBIDDEN'               // 403
  | 'NOT_FOUND'               // 404
  | 'CONFLICT'                // 409
  | 'RATE_LIMIT'              // 429
  | 'INTERNAL_ERROR'          // 500
  | 'AI_SERVICE_ERROR'        // 503
  | 'EXCHANGE_RATE_ERROR';    // 503
