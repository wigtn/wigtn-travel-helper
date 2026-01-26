import { Request } from 'express';
import { User } from '@prisma/client';

// JWT token에서 추출된 최소 사용자 정보
export interface AuthenticatedUser {
  id: string;
  email: string;
}

// JWT 인증 후 request
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

// Local 인증 후 request (login 시) - 전체 User 객체 포함
export interface LocalAuthenticatedRequest extends Request {
  user: User;
}
