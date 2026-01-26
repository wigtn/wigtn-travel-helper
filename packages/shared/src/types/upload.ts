// @wigtn/shared - Upload Types
// Data Schema Contract SSOT

/**
 * 이미지 업로드 전략: Presigned URL 방식
 *
 * Flow:
 * 1. Mobile → Backend: 업로드 URL 요청
 * 2. Backend → S3: presigned URL 생성
 * 3. Backend → Mobile: presigned URL + 최종 URL 반환
 * 4. Mobile → S3: 직접 업로드 (PUT)
 * 5. Mobile → Backend: 최종 URL을 엔티티에 저장
 */

export type ImagePurpose = 'receipt' | 'cover';
export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic';

/** 업로드 URL 요청 */
export interface RequestUploadUrlDto {
  purpose: ImagePurpose;
  mimeType: ImageMimeType;
  fileName: string;           // 원본 파일명
}

/** 업로드 URL 응답 */
export interface UploadUrlResponse {
  uploadUrl: string;          // S3 presigned PUT URL (5분 유효)
  fileUrl: string;            // 업로드 완료 후 접근 URL
  expiresIn: number;          // seconds
}

/** 이미지 제약 */
export const IMAGE_LIMITS = {
  MAX_SIZE_MB: 10,
  MAX_WIDTH: 4096,
  MAX_HEIGHT: 4096,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const,
} as const;
