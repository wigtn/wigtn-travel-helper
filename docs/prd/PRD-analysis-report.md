# PRD Analysis Report

> **분석 대상**: PRD v1.1 (Frontend) + PRD v3.0 (Backend+AI) + Data Schema Contract
> **분석일**: 2026-01-26
> **목적**: "PRD 기반으로 구현을 시작해줘" 한마디로 Backend/Frontend/DB 구축이 가능한지 검증

---

## 요약

| 카테고리 | 발견 | Critical | Major | Minor |
|----------|------|----------|-------|-------|
| 완전성 | 8 | 3 | 3 | 2 |
| 일관성 (문서 간 충돌) | 7 | 2 | 4 | 1 |
| 기술적 실현가능성 | 4 | 1 | 2 | 1 |
| 보안 | 3 | 1 | 1 | 1 |
| **총계** | **22** | **7** | **10** | **5** |

### 결론

> 현재 상태로는 `/implement`를 실행했을 때 **구현 도중 "이건 어떻게 해야 하지?"라는 질문이 최소 7회(Critical)** 발생합니다.
> 아래 개선안을 Data Schema Contract에 반영하면, Schema → API → DB → Frontend 순으로 구현이 가능해집니다.

---

## 상세 분석

### 🔴 Critical (즉시 수정 필요 - 구현 불가)

#### C-1. PRD v1.1 vs v3 범위 충돌 - "어느 PRD를 따라야 하는가?"

- **위치**: PRD v1.1 Section 1.3 vs PRD v3 Section 1
- **문제**:
  - v1.1: "백엔드 서버/회원가입 ❌ Non-Goal", "AI 영수증 OCR ❌"
  - v3: 백엔드 + 인증 + AI 도입
  - 두 문서가 상충하는데 **어느 것이 현재 유효한지** 명시가 없음
- **영향**: 구현자가 Trip 엔티티에 `userId`/`status`를 넣어야 하는지, 오프라인 전용으로 만들어야 하는지 판단 불가
- **개선안**: PRD v1.1에 "v3에 의해 확장됨" 명시, 또는 통합 문서에서 버전별 범위를 명확히 구분

#### C-2. Destination의 국가 표현 불일치

- **위치**: PRD v1.1 Section 5.2 vs Data Schema Contract Section 3.3
- **문제**:
  - v1.1: `country: "JP"` (ISO 코드) + `countryName: "일본"` (표시명) 2개 필드
  - Data Schema Contract: `country: "프랑스"` (표시명 1개만)
  - Prisma schema: `country` 1개만
- **영향**: Frontend에서 국기 이모지 렌더링 시 ISO 코드 필요 (`JP` → 🇯🇵). 표시명만으로는 불가
- **개선안**: `countryCode: string` (ISO 3166-1 alpha-2) 필드를 추가하거나, `country` 필드를 ISO 코드로 통일하고 표시명은 클라이언트에서 매핑

#### C-3. 동기화(Sync) 프로토콜 DTO 미정의

- **위치**: PRD v3 Section 3.4 (FR-SYNC) + Data Schema Contract
- **문제**:
  - v3에 "오프라인 → 온라인 마이그레이션", "충돌 해결" 요구사항이 있지만
  - Data Schema Contract에 Sync 관련 DTO가 전혀 없음
  - `LocalExpenseRow`만 있고, 실제 동기화 API 요청/응답 타입 미정의
- **영향**: 동기화 기능 구현 시 스키마를 즉석에서 설계해야 함
- **개선안**: SyncRequestDto, SyncResponseDto, ConflictResolutionDto 정의 필요

#### C-4. 비밀번호 재설정 API/DTO 미정의

- **위치**: PRD v3 US-004 vs Data Schema Contract Section 6.1
- **문제**:
  - v3 사용자 스토리: "비밀번호를 잊어도 복구할 수 있다"
  - API 엔드포인트에 재설정 관련 없음
  - DTO도 없음
- **영향**: 인증 모듈 구현 시 이 기능을 빼야 하는지 포함해야 하는지 불명확
- **개선안**: `/auth/forgot-password`, `/auth/reset-password` 엔드포인트 + DTO 추가, 또는 US-004를 Out of Scope로 명시

#### C-5. 이미지 업로드/저장 전략 미정의

- **위치**: PRD v3 FR-AI-005 + Data Schema Contract
- **문제**:
  - v3: "영수증 이미지를 클라우드에 저장", "S3 호환 스토리지"
  - Trip의 `coverImage`도 이미지인데 업로드 방법 미정의
  - Base64? Multipart form-data? Presigned URL?
  - 이미지 최대 크기, 리사이징 정책 등 미정의
- **영향**: Frontend 이미지 피커 → 업로드 플로우 전체가 설계 안됨
- **개선안**: 이미지 업로드 전략 섹션 추가 (presigned URL 방식 권장)

#### C-6. 배치 OCR 처리 DTO 미정의

- **위치**: PRD v3 FR-AI-004 vs Data Schema Contract
- **문제**:
  - v3: "여러 영수증을 한번에 업로드, 순차 분석, 일괄 확인/등록"
  - Data Schema Contract에 단일 영수증 요청만 정의
  - 배치 요청/응답 타입 없음
- **영향**: 배치 기능 구현 불가
- **개선안**: `BatchAnalyzeReceiptRequestDto`, `BatchAnalyzeReceiptResponseDto` 추가

#### C-7. 스트리밍 챗봇 응답 프로토콜 미정의

- **위치**: PRD v3 FR-AI-013 vs Data Schema Contract
- **문제**:
  - v3: "챗봇 응답을 스트리밍으로 표시"
  - Data Schema Contract에 SSE/WebSocket 프로토콜 미정의
  - `/ai/chat` 엔드포인트가 POST 동기 응답만 정의되어 있음
- **영향**: 챗봇 UX의 핵심 기능인 스트리밍이 구현 가이드 없음
- **개선안**: `/ai/chat/stream` SSE 엔드포인트 + 스트리밍 이벤트 타입 정의

---

### 🟡 Major (구현 전 수정 권장)

#### M-1. API 엔드포인트 경로 불일치

- **위치**: PRD v3 Section 3.5 vs Data Schema Contract Section 6.4
- **문제**:
  - v3: 개별 지출 `GET /expenses/:id`, `PATCH /expenses/:id`, `DELETE /expenses/:id`
  - Data Schema Contract: `PATCH /trips/:tripId/expenses/:id`, `DELETE /trips/:tripId/expenses/:id`
  - 환율 변환: v3 = `GET`, Contract = `POST`
- **영향**: Frontend API 클라이언트 구현 시 어느 경로를 따를지 혼란
- **개선안**: Data Schema Contract를 정본으로 통일

#### M-2. Chat 히스토리 응답 타입 불일치

- **위치**: Data Schema Contract Section 6.5
- **문제**:
  - 히스토리 응답: `ApiResponse<ChatMessage[]>` (role + content만)
  - DB에 저장된 ChatMessage에는 `id`, `userId`, `tripId`, `createdAt` 포함
  - 클라이언트에서 타임스탬프, 메시지 ID가 필요
- **영향**: 채팅 UI에서 시간 표시, 메시지 삭제 등 불가
- **개선안**: `ChatHistoryMessage` 응답 타입 별도 정의 (BaseEntity + ChatMessage)

#### M-3. Wallet 범위 최종 결정 미반영

- **위치**: PRD v3 vs Data Schema Contract
- **문제**:
  - v3 PRD: Wallet API 엔드포인트 명시되어 있음
  - Data Schema Contract: "MVP에서 제외" 결정
  - Prisma schema: Wallet 모델 존재
  - `PaymentMethod`: v3에는 `'wallet'` 포함, Contract에서는 제거
  - **결정이 v3 PRD에 역반영되지 않음**
- **영향**: 구현자가 Wallet을 만들어야 하는지 혼란
- **개선안**: v3 PRD에 Wallet 관련 섹션을 "Phase 2" 또는 "Out of Scope (v4)"로 명시

#### M-4. 데이터 삭제 정책 미정의

- **위치**: 전체 PRD
- **문제**:
  - Soft delete vs Hard delete 명시 없음
  - Trip 삭제 시 하위 Expense, Destination 일괄 삭제 (Cascade)는 Prisma에 있지만
  - 사용자 계정 삭제 시 데이터 보존 기간?
  - 실수로 삭제 시 복구 방법?
- **영향**: GDPR/개인정보보호법 대응 불가, 사용자 불만 가능
- **개선안**: 삭제 정책 섹션 추가 (soft delete 30일 후 hard delete 권장)

#### M-5. ExpenseStats 계산 주체 불명확

- **위치**: Data Schema Contract Section 3.4
- **문제**:
  - `ExpenseStats`가 정의되어 있지만 누가 계산하는지 불명확
  - Backend에서 계산? → API 응답으로 내려줌
  - Frontend에서 계산? → 로컬 데이터로 계산
  - 오프라인일 때는?
- **영향**: 같은 로직을 양쪽에 중복 구현할 위험
- **개선안**: "Backend 계산 후 API 응답, 오프라인 시 Mobile에서 동일 로직으로 계산"으로 명시

#### M-6. 채팅 히스토리 페이지네이션 미정의

- **위치**: Data Schema Contract Section 6.5
- **문제**:
  - `GET /ai/chat/history` 응답이 `ChatMessage[]` (전체 배열)
  - 대화가 수백 건 쌓이면?
  - 페이지네이션 미적용
- **영향**: 성능 저하, 메모리 이슈
- **개선안**: `PaginatedResponse<ChatHistoryMessage>` 적용 + 최근 20개 기본 로드

#### M-7. `countryCode` ↔ 국기 이모지/국가명 매핑 상수 없음

- **위치**: Data Schema Contract Section 4
- **문제**:
  - 국가 코드 → 국기 이모지 변환 로직이 어디에도 정의 안됨
  - `CURRENCY_LABELS`는 있지만 `COUNTRY_LABELS`는 없음
  - 국가 선택 UI에서 필요한 국가 목록이 통화 목록에서 역매핑해야 함
- **개선안**: `SUPPORTED_COUNTRIES` 상수 + `countryCode` 필드 추가

#### M-8. 환율 검증 로직 미상세

- **위치**: Data Schema Contract Section 7.1 (데이터 흐름)
- **문제**:
  - "환율 검증 (±5% 허용)" 한 줄 언급
  - 검증 실패 시 어떻게 되는가? 거부? 서버 환율로 덮어쓰기?
  - 5%의 근거?
- **개선안**: 검증 정책을 명확히: "서버 환율 대비 ±10% 초과 시 경고 반환, 클라이언트 제출값 존중"

#### M-9. `UpdateTripDto`에 destinations 업데이트 방법 미정의

- **위치**: Data Schema Contract Section 3.3
- **문제**:
  - `UpdateTripDto`에 `destinations` 필드가 없음
  - 여행 수정 시 방문지를 동시에 수정하려면?
  - 별도 Destination CRUD 엔드포인트는 있지만, 일괄 업데이트는?
- **개선안**: 방문지는 개별 CRUD로 관리한다고 명시

#### M-10. PRD에 구현 우선순위가 불명확한 Task 분해

- **위치**: Data Schema Contract Section 8 + PRD v3 Section 8
- **문제**:
  - `/implement` 실행 시 todo_plan으로 Task를 분해해야 하는데
  - 현재 Phase 분류가 기능 단위(인증, AI 등)로만 되어 있음
  - "Schema 먼저 → DB → Backend → Frontend" 같은 레이어별 순서가 부족
- **영향**: 구현 순서를 매번 판단해야 함
- **개선안**: Section 11로 "Implementation Checklist" 추가 (아래 참조)

---

### 🟢 Minor (개선 제안)

#### m-1. PRD v1.1 카테고리 아이콘 vs Shared 상수 이중 정의

- **위치**: PRD v1.1 Appendix B vs Data Schema Contract Section 4
- **문제**: v1.1에는 이모지(🍽️), Shared에는 Material Icon(`restaurant`)
- **개선안**: 둘 다 유지하되 Shared에 `CATEGORY_EMOJIS` 추가

#### m-2. 지원 통화 목록 불일치

- **위치**: PRD v1.1 Appendix A (14개) vs Data Schema Contract (18개)
- **문제**: v1.1에 CHF, CZK, NZD, CAD 없음
- **개선안**: Data Schema Contract를 정본으로, v1.1 업데이트 불필요 (v3가 우선)

#### m-3. HEIC vs WebP 이미지 포맷 불일치

- **위치**: PRD v3 FR-AI-001 vs Data Schema Contract Section 3.6
- **문제**: v3은 "JPEG, PNG, HEIC", Contract은 "image/jpeg, image/png, image/webp"
- **개선안**: 모두 지원으로 통일 (JPEG, PNG, WebP, HEIC)

#### m-4. "로그인 없이 사용하기" 플로우 미상세

- **위치**: PRD v3 Section 4.1
- **문제**: UI에 "로그인 없이 사용하기 (오프라인 모드)" 버튼이 있지만, 이후 로그인 시 데이터 마이그레이션 플로우가 상세하지 않음
- **개선안**: 게스트 모드 → 회원가입 시 자동 마이그레이션 프롬프트 플로우 추가

#### m-5. 용어 불일치

- **위치**: 전체 PRD
- **문제**: "방문지"와 "Destination", "지출"과 "Expense"가 혼용
- **개선안**: 한국어 기준 용어집(Glossary) 추가

---

## 누락된 요구사항

| ID | 요구사항 | 권장 우선순위 | 관련 이슈 |
|----|---------|--------------|----------|
| NEW-1 | 비밀번호 재설정 API + DTO | P0 | C-4 |
| NEW-2 | 이미지 업로드 API (presigned URL) | P0 | C-5 |
| NEW-3 | Sync DTO (마이그레이션/충돌 해결) | P1 | C-3 |
| NEW-4 | 배치 OCR 요청/응답 DTO | P1 | C-6 |
| NEW-5 | 챗봇 스트리밍 SSE 프로토콜 | P1 | C-7 |
| NEW-6 | `Destination.countryCode` 필드 | P0 | C-2 |
| NEW-7 | `ChatHistoryMessage` 응답 타입 | P1 | M-2 |
| NEW-8 | Implementation Checklist (레이어별 구현 순서) | P0 | M-10 |
| NEW-9 | 데이터 삭제 정책 | P2 | M-4 |
| NEW-10 | 환율 검증 정책 상세 | P2 | M-8 |

---

## 리스크 매트릭스

| 리스크 | 발생 확률 | 영향도 | 대응 방안 |
|--------|----------|--------|----------|
| PRD 충돌로 잘못된 구현 | 높음 | 높음 | 문서 간 정본/종속 관계 명시 |
| 동기화 미설계로 데이터 유실 | 중간 | 높음 | Sync DTO 사전 정의 |
| 이미지 업로드 방식 재작업 | 높음 | 중간 | 업로드 전략 확정 후 구현 |
| AI 스트리밍 미정의로 UX 저하 | 중간 | 중간 | SSE 프로토콜 사전 정의 |
| 국가 코드 미정의로 UI 깨짐 | 높음 | 낮음 | countryCode 필드 추가 |

---

## 다음 단계

이 보고서의 Critical/Major 이슈를 Data Schema Contract에 반영한 후,
`/implement` 명령으로 구현을 시작할 수 있습니다.

개선 적용 순서:
1. Data Schema Contract 업데이트 (이 보고서 기반)
2. `/implement` 실행 시 todo_plan으로 체크리스트 자동 생성
3. Schema → DB → Backend API → Frontend 순서로 구현
4. AI Engine은 Phase 3~4에서 별도 구현
