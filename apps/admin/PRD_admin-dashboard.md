# Travel Helper Admin Dashboard PRD

> **Version**: 1.0
> **Created**: 2026-01-27
> **Status**: Draft

## 1. Overview

### 1.1 Problem Statement
Travel Helper 서비스의 운영 및 관리를 위해 관리자가 다음 항목을 모니터링하고 관리할 수 있는 통합 대시보드가 필요합니다:
- 회원 관리 (가입/탈퇴/활동 현황)
- 서비스 트래픽 및 API 사용량 조회
- AI 기능(OCR, 챗봇) 사용 현황 및 비용 모니터링
- 시스템 리소스(Redis, DB) 상태 확인

### 1.2 Goals
- 관리자가 서비스 전체 현황을 한눈에 파악할 수 있는 통합 대시보드 제공
- 회원 정보 조회/관리/검색 기능 제공
- AI 기능 사용량 및 비용 추적을 통한 운영 효율화
- 실시간 트래픽 및 시스템 모니터링으로 장애 조기 감지

### 1.3 Non-Goals (Out of Scope)
- 일반 사용자용 기능 개발 (모바일 앱은 별도)
- AI 모델 자체 학습/튜닝
- 결제/정산 시스템 (MVP 이후)
- 푸시 알림 관리 (MVP 이후)

### 1.4 Scope
| 포함 | 제외 |
|------|------|
| 관리자 인증/권한 관리 | 일반 사용자 기능 |
| 회원 목록/상세/검색 | 회원 직접 가입 |
| AI 사용량 통계 | AI 모델 관리 |
| API 트래픽 모니터링 | 로드밸런서 설정 |
| Redis/DB 상태 조회 | 인프라 직접 관리 |
| 지출 데이터 통계 | 개인 지출 관리 |

---

## 2. User Stories

### 2.1 Primary Users
- **슈퍼 관리자 (Super Admin)**: 모든 기능 접근 가능, 관리자 계정 생성/관리
- **운영 관리자 (Operator)**: 회원 관리, 통계 조회, 모니터링

### 2.2 User Stories

#### US-001: 관리자 로그인
> As a 관리자, I want to 별도의 관리자 계정으로 로그인 so that 일반 사용자와 분리된 관리 영역에 접근할 수 있다.

#### US-002: 대시보드 Overview
> As a 관리자, I want to 서비스 핵심 지표를 한눈에 볼 수 있는 대시보드 so that 서비스 상태를 빠르게 파악할 수 있다.

#### US-003: 회원 관리
> As a 관리자, I want to 회원 목록 조회/검색/상세 확인 so that 사용자 문의 대응 및 관리가 가능하다.

#### US-004: AI 사용량 모니터링
> As a 관리자, I want to OCR 및 챗봇 사용량 통계 so that AI 비용을 관리하고 사용 패턴을 분석할 수 있다.

#### US-005: 트래픽 모니터링
> As a 관리자, I want to API 호출량과 응답시간 통계 so that 서비스 품질을 관리할 수 있다.

### 2.3 Acceptance Criteria (Gherkin)

```gherkin
Scenario: 관리자 로그인
  Given 관리자 계정이 있는 상태에서
  When 올바른 이메일/비밀번호로 로그인하면
  Then 관리자 대시보드로 이동한다
  And JWT 토큰이 발급된다

Scenario: 대시보드 Overview 조회
  Given 로그인된 관리자가
  When 대시보드에 접근하면
  Then 오늘의 신규 회원 수가 표시된다
  And 총 회원 수가 표시된다
  And AI 사용량이 표시된다
  And 활성 트래픽이 표시된다

Scenario: 회원 검색
  Given 로그인된 관리자가
  When 이메일 "test@example.com"으로 검색하면
  Then 해당 회원 정보가 목록에 표시된다

Scenario: AI 사용량 조회
  Given 로그인된 관리자가
  When AI 모니터링 페이지에 접근하면
  Then 기간별 OCR 요청 수가 표시된다
  And 기간별 챗봇 메시지 수가 표시된다
  And 예상 비용이 표시된다
```

---

## 3. Functional Requirements

### 3.1 관리자 인증 및 권한

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-001 | 관리자 전용 로그인 (이메일/비밀번호) | P0 (Must) | - |
| FR-002 | 관리자 JWT 토큰 발급 (accessToken, refreshToken) | P0 (Must) | FR-001 |
| FR-003 | 역할 기반 권한 (SUPER_ADMIN, OPERATOR) | P0 (Must) | FR-001 |
| FR-004 | 관리자 계정 생성 (Super Admin only) | P1 (Should) | FR-003 |
| FR-005 | 관리자 비밀번호 재설정 | P1 (Should) | FR-001 |

### 3.2 대시보드 Overview

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-010 | 오늘/이번주/이번달 신규 회원 수 표시 | P0 (Must) | - |
| FR-011 | 총 회원 수 / 활성 회원 수 표시 | P0 (Must) | - |
| FR-012 | 오늘의 AI 사용량 (OCR, 챗봇) 요약 | P0 (Must) | - |
| FR-013 | 실시간 API 요청 수 표시 | P1 (Should) | Redis |
| FR-014 | 시스템 상태 (DB, Redis, AI Service) 표시 | P1 (Should) | - |
| FR-015 | 최근 7일 주요 지표 차트 | P2 (Could) | - |

### 3.3 회원 관리

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-020 | 회원 목록 조회 (페이지네이션) | P0 (Must) | - |
| FR-021 | 회원 검색 (이메일, 이름) | P0 (Must) | FR-020 |
| FR-022 | 회원 상세 정보 조회 | P0 (Must) | FR-020 |
| FR-023 | 회원 여행/지출 통계 조회 | P1 (Should) | FR-022 |
| FR-024 | 회원 비활성화/활성화 | P1 (Should) | FR-022 |
| FR-025 | 회원 삭제 (Soft Delete) | P2 (Could) | FR-022 |
| FR-026 | 회원 가입 경로별 통계 (local, apple, google) | P2 (Could) | - |

### 3.4 AI 모니터링

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-030 | OCR 요청 수 통계 (일별/주별/월별) | P0 (Must) | - |
| FR-031 | 챗봇 메시지 수 통계 (일별/주별/월별) | P0 (Must) | - |
| FR-032 | AI Provider별 사용량 (OpenAI, Groq, Self-hosted) | P1 (Should) | - |
| FR-033 | 예상 AI 비용 계산 | P1 (Should) | FR-030, FR-031 |
| FR-034 | OCR 성공률/실패율 통계 | P1 (Should) | - |
| FR-035 | 평균 응답 시간 통계 | P2 (Could) | - |

### 3.5 트래픽 모니터링

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-040 | API 엔드포인트별 호출 수 | P0 (Must) | Redis |
| FR-041 | 시간대별 트래픽 그래프 | P1 (Should) | Redis |
| FR-042 | 평균 응답 시간 (p50, p95, p99) | P1 (Should) | Redis |
| FR-043 | 에러율 통계 (4xx, 5xx) | P1 (Should) | Redis |
| FR-044 | 동시 접속자 수 (실시간) | P2 (Could) | Redis |

### 3.6 시스템 모니터링

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-050 | PostgreSQL 연결 상태 확인 | P0 (Must) | - |
| FR-051 | Redis 연결 상태 및 메모리 사용량 | P0 (Must) | - |
| FR-052 | AI Service 헬스 체크 | P0 (Must) | - |
| FR-053 | 캐시 히트율 통계 | P2 (Could) | Redis |

---

## 4. Non-Functional Requirements

### 4.1 Performance
| Metric | Target |
|--------|--------|
| Dashboard 로딩 | < 2s |
| 회원 목록 조회 | < 500ms |
| 검색 응답 | < 300ms |
| 실시간 데이터 갱신 | 5초 간격 |

### 4.2 Security
- **인증**: 관리자 전용 JWT (일반 사용자와 분리)
- **권한**: RBAC (Role-Based Access Control)
- **감사 로그**: 관리자 주요 행위 로깅
- **IP 제한**: 특정 IP만 접근 허용 (선택)
- **2FA**: 선택적 2단계 인증 (P2)

### 4.3 Scalability
- 회원 100만 명 이상 처리 가능
- 동시 접속 관리자 50명 지원

### 4.4 Availability
- 목표 가용성: 99.5%
- 관리자 페이지 장애 시 일반 서비스 영향 없음

---

## 5. Technical Design

### 5.1 Architecture
```
┌─────────────────┐     ┌─────────────────┐
│   Admin Web     │────▶│   Admin API     │
│   (Next.js)     │     │   (NestJS)      │
└─────────────────┘     └────────┬────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  PostgreSQL   │       │     Redis     │       │  AI Service   │
│  (기존 DB)     │       │  (트래픽/캐시) │       │  (Python)     │
└───────────────┘       └───────────────┘       └───────────────┘
```

### 5.2 Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+ (App Router), React 18, TypeScript |
| UI | Tailwind CSS, shadcn/ui |
| Charts | Recharts 또는 Chart.js |
| State | Zustand |
| Backend | NestJS (기존 API 확장 또는 별도 서비스) |
| Auth | JWT (별도 Admin 토큰) |
| DB | PostgreSQL (기존 Prisma 활용) |
| Cache | Redis (트래픽 메트릭 저장) |

### 5.3 Database Schema Changes

#### 5.3.1 Admin 테이블 추가

```prisma
// 관리자 계정
model Admin {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String    @map("password_hash")
  name         String
  role         AdminRole @default(OPERATOR)
  isActive     Boolean   @default(true) @map("is_active")
  lastLoginAt  DateTime? @map("last_login_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  refreshTokens AdminRefreshToken[]
  auditLogs     AdminAuditLog[]

  @@map("admins")
}

enum AdminRole {
  SUPER_ADMIN
  OPERATOR
}

// 관리자 RefreshToken
model AdminRefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  adminId   String   @map("admin_id")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  admin Admin @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@map("admin_refresh_tokens")
}

// 관리자 행위 감사 로그
model AdminAuditLog {
  id        String   @id @default(uuid())
  adminId   String   @map("admin_id")
  action    String   // LOGIN, VIEW_USER, UPDATE_USER, etc.
  targetType String? @map("target_type") // User, Trip, etc.
  targetId  String?  @map("target_id")
  details   Json?
  ipAddress String?  @map("ip_address")
  createdAt DateTime @default(now()) @map("created_at")

  admin Admin @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@index([adminId])
  @@index([action])
  @@index([createdAt])
  @@map("admin_audit_logs")
}

// AI 사용량 로그
model AIUsageLog {
  id          String   @id @default(uuid())
  userId      String?  @map("user_id")
  type        String   // OCR, CHAT
  provider    String   // openai, groq, self-hosted
  model       String?  // gpt-4o, llama-3.3-70b, etc.
  inputTokens Int?     @map("input_tokens")
  outputTokens Int?    @map("output_tokens")
  success     Boolean  @default(true)
  latencyMs   Int?     @map("latency_ms")
  errorMessage String? @map("error_message")
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([type])
  @@index([provider])
  @@index([createdAt])
  @@index([userId])
  @@map("ai_usage_logs")
}

// API 트래픽 로그 (Redis에서 주기적 집계)
model ApiTrafficLog {
  id           Int      @id @default(autoincrement())
  date         DateTime @db.Date
  hour         Int?     // 0-23, null이면 일별 집계
  endpoint     String
  method       String
  requestCount Int      @map("request_count")
  avgLatencyMs Int?     @map("avg_latency_ms")
  p95LatencyMs Int?     @map("p95_latency_ms")
  errorCount   Int      @default(0) @map("error_count")
  createdAt    DateTime @default(now()) @map("created_at")

  @@unique([date, hour, endpoint, method])
  @@index([date])
  @@index([endpoint])
  @@map("api_traffic_logs")
}
```

### 5.4 API Endpoints

#### 5.4.1 관리자 인증
| Method | Path | Description |
|--------|------|-------------|
| POST | /admin/auth/login | 관리자 로그인 |
| POST | /admin/auth/refresh | 토큰 갱신 |
| POST | /admin/auth/logout | 로그아웃 |
| GET | /admin/auth/me | 현재 관리자 정보 |

#### 5.4.2 대시보드
| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/dashboard/overview | 대시보드 요약 데이터 |
| GET | /admin/dashboard/stats | 주요 지표 통계 |
| GET | /admin/dashboard/system-status | 시스템 상태 |

#### 5.4.3 회원 관리
| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/users | 회원 목록 (페이지네이션) |
| GET | /admin/users/:id | 회원 상세 |
| GET | /admin/users/:id/stats | 회원 통계 (여행, 지출) |
| PATCH | /admin/users/:id | 회원 정보 수정 |
| DELETE | /admin/users/:id | 회원 비활성화/삭제 |

#### 5.4.4 AI 모니터링
| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/ai/usage | AI 사용량 통계 |
| GET | /admin/ai/cost | 예상 비용 |
| GET | /admin/ai/performance | 성능 통계 |

#### 5.4.5 트래픽 모니터링
| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/traffic/overview | 트래픽 개요 |
| GET | /admin/traffic/endpoints | 엔드포인트별 통계 |
| GET | /admin/traffic/realtime | 실시간 트래픽 (WebSocket/SSE) |

#### 5.4.6 시스템 모니터링
| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/system/health | 전체 헬스 체크 |
| GET | /admin/system/redis | Redis 상태 |
| GET | /admin/system/database | DB 상태 |

---

## 6. Implementation Phases

### Phase 1: MVP (Core Admin)
- [ ] Admin 스키마 및 마이그레이션
- [ ] 관리자 인증 API (로그인, 토큰)
- [ ] 대시보드 Overview API
- [ ] 회원 목록/검색/상세 API
- [ ] Admin 프론트엔드 셋업 (Next.js)
- [ ] 로그인 페이지
- [ ] 대시보드 메인 페이지
- [ ] 회원 관리 페이지

**Deliverable**: 관리자 로그인, 기본 대시보드, 회원 조회 기능

### Phase 2: AI & Traffic Monitoring
- [ ] AI 사용량 로깅 미들웨어
- [ ] AI 통계 API
- [ ] Redis 트래픽 로깅 미들웨어
- [ ] 트래픽 통계 API
- [ ] AI 모니터링 페이지
- [ ] 트래픽 모니터링 페이지

**Deliverable**: AI 사용량 및 트래픽 모니터링 기능

### Phase 3: Advanced Features
- [ ] 실시간 모니터링 (WebSocket/SSE)
- [ ] 시스템 상태 대시보드
- [ ] 관리자 감사 로그
- [ ] 관리자 계정 관리 (SUPER_ADMIN)
- [ ] 차트 및 시각화 개선

**Deliverable**: 실시간 모니터링, 감사 로그, 관리자 관리

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| 대시보드 로딩 시간 | < 2초 | Performance 모니터링 |
| 관리자 만족도 | 4.0/5.0 이상 | 내부 설문 |
| 장애 조기 감지율 | 80% 이상 | 인시던트 분석 |
| 평균 문의 대응 시간 | 50% 감소 | 운영 로그 |

---

## 8. UI/UX Wireframe (High-Level)

### 8.1 대시보드 레이아웃
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] Travel Helper Admin          [Admin Name] [Logout]      │
├──────────┬──────────────────────────────────────────────────────┤
│          │  Dashboard Overview                                  │
│ Dashboard│  ┌──────────┬──────────┬──────────┬──────────┐       │
│ Users    │  │ 총 회원  │ 오늘 가입│ AI 사용  │ API 요청 │       │
│ AI       │  │ 12,345   │ +23      │ 1,234    │ 45,678   │       │
│ Traffic  │  └──────────┴──────────┴──────────┴──────────┘       │
│ System   │                                                      │
│          │  ┌──────────────────────────────────────────────┐    │
│ ─────────│  │          Weekly Trend Chart                  │    │
│ Settings │  │  [Chart Area]                                │    │
│          │  └──────────────────────────────────────────────┘    │
│          │                                                      │
│          │  ┌────────────────────┬─────────────────────────┐    │
│          │  │ Recent Users       │ System Status           │    │
│          │  │ - user1@email.com  │ ● DB: Healthy           │    │
│          │  │ - user2@email.com  │ ● Redis: Healthy        │    │
│          │  │ - user3@email.com  │ ● AI: Healthy           │    │
│          │  └────────────────────┴─────────────────────────┘    │
└──────────┴──────────────────────────────────────────────────────┘
```

### 8.2 회원 관리 페이지
```
┌─────────────────────────────────────────────────────────────────┐
│  Users                                          [+ Add Admin]   │
├─────────────────────────────────────────────────────────────────┤
│  Search: [________________] [Provider ▼] [Status ▼] [Search]    │
├─────────────────────────────────────────────────────────────────┤
│  Email              │ Name    │ Provider │ Created   │ Actions  │
│  ───────────────────┼─────────┼──────────┼───────────┼────────  │
│  test1@example.com  │ 홍길동  │ local    │ 2026-01-15│ [View]   │
│  test2@gmail.com    │ 김철수  │ google   │ 2026-01-14│ [View]   │
│  test3@icloud.com   │ 이영희  │ apple    │ 2026-01-13│ [View]   │
├─────────────────────────────────────────────────────────────────┤
│  << 1 2 3 4 5 ... 100 >>                         Total: 12,345  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Appendix

### 9.1 AI 비용 산정 기준 (예시)
| Provider | Model | Input ($/1M tokens) | Output ($/1M tokens) |
|----------|-------|---------------------|----------------------|
| OpenAI | GPT-4o | $5.00 | $15.00 |
| OpenAI | GPT-4o-mini | $0.15 | $0.60 |
| Groq | Llama-3.3-70b | $0.59 | $0.79 |
| Groq | Llama-3.2-90b-vision | $0.90 | $0.90 |

### 9.2 Redis Key 설계

```
# API 트래픽 (실시간)
traffic:realtime:{endpoint}:{method}:{timestamp}  # Counter
traffic:latency:{endpoint}:{method}               # List (최근 100개)

# AI 사용량 (일별)
ai:usage:ocr:{date}          # Counter
ai:usage:chat:{date}         # Counter
ai:tokens:{provider}:{date}  # Hash {input, output}

# 세션
admin:session:{adminId}      # String (최근 활동 시간)
```

### 9.3 관련 문서
- [Travel Helper v3.0 API Schema](../api/prisma/schema.prisma)
- [AI Service Documentation](../ai-service/README.md)
- [Design Guide](../../docs/DESIGN-GUIDE.md)
