// @wigtn/shared - User & Auth Types
// Data Schema Contract SSOT

import { BaseEntity } from './common';

export type AuthProvider = 'local' | 'apple' | 'google';

export interface User extends BaseEntity {
  email: string;
  name: string;
  provider: AuthProvider;
  // passwordHash는 API 내부 전용 - 절대 공유하지 않음
}

/** 회원가입 */
export interface RegisterDto {
  email: string;
  password: string;           // min: 8, max: 100
  name?: string;              // max: 100, optional
}

/** 로그인 */
export interface LoginDto {
  email: string;
  password: string;
}

/** 소셜 로그인 */
export interface SocialLoginDto {
  provider: 'apple' | 'google';
  idToken: string;
}

/** 인증 토큰 응답 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;          // seconds (e.g., 900 = 15분)
}

/** 인증 후 사용자 정보 응답 */
export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

/** 비밀번호 재설정 요청 (이메일로 코드 전송) */
export interface ForgotPasswordDto {
  email: string;
}

/** 비밀번호 재설정 실행 */
export interface ResetPasswordDto {
  email: string;
  code: string;               // 이메일로 받은 6자리 코드
  newPassword: string;        // min: 8, max: 100
}

/** 토큰 갱신 요청 */
export interface RefreshTokenDto {
  refreshToken: string;
}
