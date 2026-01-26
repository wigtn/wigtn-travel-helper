// @wigtn/shared - AI Types
// Data Schema Contract SSOT

import { BaseEntity, PaginationParams } from './common';
import { Category } from './expense';
import { CreateExpenseDto } from './expense';

// ─── Receipt OCR ───

/** 영수증 개별 항목 */
export interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;           // default: 1
}

/** 영수증 OCR 분석 결과 */
export interface ReceiptAnalysis {
  store: string;              // 매장명
  date: string;               // YYYY-MM-DD
  time?: string;              // HH:mm
  items: ReceiptItem[];
  subtotal?: number;
  tax?: number;
  total: number;
  currency: string;           // VarChar(3)
  category: Category;         // AI가 추론한 카테고리
  confidence: number;         // 0.0 ~ 1.0
  rawText?: string;           // OCR 원본 텍스트
}

// ─── Mobile → Backend 요청 ───

/** 영수증 분석 요청 (Mobile → Backend) */
export interface AnalyzeReceiptRequestDto {
  image: string;              // Base64 encoded image
  mimeType: string;           // "image/jpeg" | "image/png" | "image/webp"
  tripId: string;             // 여행 ID (지출 자동 연결용)
  destinationId?: string;     // 방문지 ID
}

/** 영수증 분석 응답 (Backend → Mobile) */
export interface AnalyzeReceiptResponseDto {
  success: boolean;
  analysis: ReceiptAnalysis | null;
  suggestedExpense?: CreateExpenseDto; // AI가 추천하는 지출 입력값
  error?: string;
}

// ─── Backend → AI-Engine 요청 (내부 API) ───

/** 영수증 분석 요청 (Backend → AI-Engine) */
export interface AIReceiptRequest {
  image: string;              // Base64 encoded image
  mimeType: string;
}

/** 영수증 분석 응답 (AI-Engine → Backend) */
export interface AIReceiptResponse {
  success: boolean;
  analysis: ReceiptAnalysis | null;
  error?: string;
}

// ─── Batch OCR ───

/** 배치 영수증 분석 요청 (Mobile → Backend) */
export interface BatchAnalyzeReceiptRequestDto {
  receipts: AnalyzeReceiptRequestDto[];  // max: 10
}

/** 배치 영수증 분석 응답 (Backend → Mobile) */
export interface BatchAnalyzeReceiptResponseDto {
  results: AnalyzeReceiptResponseDto[];
  successCount: number;
  failCount: number;
}

// ─── Chatbot ───

/** 챗 메시지 역할 */
export type ChatRole = 'user' | 'assistant' | 'system';

/** 챗 메시지 */
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// ─── Mobile → Backend 요청 ───

/** 챗봇 요청 (Mobile → Backend) */
export interface ChatRequestDto {
  message: string;            // max: 2000
  tripId?: string;            // 여행 컨텍스트 (지출 분석 등)
  conversationId?: string;    // 이전 대화 이어가기
}

/** 챗봇 응답 (Backend → Mobile) */
export interface ChatResponseDto {
  message: string;
  conversationId: string;
  suggestions?: string[];     // 후속 질문 추천
}

// ─── Backend → AI-Engine 요청 (내부 API) ───

/** 챗 요청 (Backend → AI-Engine) */
export interface AIChatRequest {
  message: string;
  context?: string;           // Backend가 구성한 컨텍스트 (여행/지출 요약)
  history?: ChatMessage[];    // 이전 대화 히스토리
}

/** 챗 응답 (AI-Engine → Backend) */
export interface AIChatResponse {
  message: string;
  tokensUsed?: number;
}

// ─── Streaming Chat ───

/**
 * 스트리밍 챗봇 프로토콜: Server-Sent Events (SSE)
 *
 * Endpoint: POST /ai/chat/stream
 * Content-Type: text/event-stream
 */

export type ChatStreamEventType = 'token' | 'done' | 'error';

export interface ChatStreamTokenEvent {
  type: 'token';
  content: string;             // 스트리밍 토큰 조각
}

export interface ChatStreamDoneEvent {
  type: 'done';
  conversationId: string;
  suggestions?: string[];
}

export interface ChatStreamErrorEvent {
  type: 'error';
  message: string;
}

export type ChatStreamEvent =
  | ChatStreamTokenEvent
  | ChatStreamDoneEvent
  | ChatStreamErrorEvent;

// ─── Chat History ───

/** DB에 저장된 채팅 메시지 (히스토리 조회 응답용) */
export interface ChatHistoryMessage extends BaseEntity {
  userId: string;
  tripId?: string;
  role: ChatRole;
  content: string;
}

/** 채팅 히스토리 필터 */
export interface ChatHistoryParams extends PaginationParams {
  tripId?: string;
}

// ─── AI Provider Config ───

/** AI Provider 설정 (Backend 내부 전용이나, 설정 타입 공유) */
export type AIProviderType = 'self-hosted' | 'openai' | 'groq' | 'anthropic';

export interface AIProviderConfig {
  type: AIProviderType;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}
