# Travel Expense Tracker PRD

> **Version**: 1.0
> **Created**: 2026-01-18
> **Status**: Draft
> **Platform**: Expo React Native

## 1. Overview

### 1.1 Problem Statement
해외 여행 중 가계부를 작성할 때 매번 환율을 확인하고 계산기로 곱해서 원화로 변환하는 과정이 너무 번거롭다. 여행 후 지출 내역을 정리하려면 상당한 시간과 노력이 필요하다.

### 1.2 Goals
- 해외 지출 입력 시 자동으로 원화 변환
- 여행별 일정과 지출을 한눈에 관리
- 최소한의 터치로 빠른 지출 기록
- 오프라인에서도 사용 가능

### 1.3 Non-Goals (Out of Scope)
- 카드사/은행 연동 (핀테크 사업자 등록 필요)
- 항공권/숙소 예약 기능
- 소셜 공유 기능
- 다국어 지원 (MVP는 한국어만)

### 1.4 Scope

| 포함 | 제외 |
|------|------|
| 여행 일정 캘린더 | 카드사 API 연동 |
| 지출 기록 + 자동 환율 변환 | 항공권/숙소 예약 |
| 오프라인 지원 | 다른 사용자와 공유 |
| 지출 통계/리포트 | 복잡한 예산 계획 |
| 빠른 입력 UI | 영수증 OCR (Phase 2) |

## 2. User Stories

### 2.1 Primary User
해외 여행을 자주 가는 20-40대 한국인 여행자

### 2.2 User Stories

**US-001: 여행 생성**
As a 여행자, I want to 새 여행을 만들고 국가/기간을 설정 so that 해당 여행의 지출을 따로 관리할 수 있다.

**US-002: 빠른 지출 입력**
As a 여행자, I want to 현지 통화로 금액만 입력하면 자동으로 원화 변환 so that 계산기를 쓰지 않아도 된다.

**US-003: 일별 지출 확인**
As a 여행자, I want to 캘린더에서 날짜별 지출을 확인 so that 언제 얼마를 썼는지 한눈에 파악할 수 있다.

**US-004: 지출 통계**
As a 여행자, I want to 카테고리별/일별 지출 통계를 확인 so that 여행 경비를 분석할 수 있다.

### 2.3 Acceptance Criteria (Gherkin)

```gherkin
Scenario: 빠른 지출 입력
  Given 일본 여행 중이고 환율이 100엔=900원일 때
  When 사용자가 "1500" 입력하고 "식비" 카테고리 선택
  Then 1500엔 = 13,500원으로 자동 변환되어 저장
  And 캘린더 해당 날짜에 지출 반영

Scenario: 오프라인 지출 입력
  Given 인터넷 연결이 없는 상태
  When 지출을 입력
  Then 마지막 캐시된 환율로 계산되어 저장
  And 온라인 복귀 시 환율 업데이트 (선택적 재계산)
```

## 3. Functional Requirements

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-001 | 여행 생성 (국가, 기간, 통화 선택) | P0 (Must) | - |
| FR-002 | 지출 입력 (금액, 카테고리, 메모) | P0 (Must) | FR-001 |
| FR-003 | 실시간 환율 API 연동 (일별 캐싱) | P0 (Must) | - |
| FR-004 | 자동 원화 변환 | P0 (Must) | FR-002, FR-003 |
| FR-005 | 캘린더 뷰 (날짜별 지출 표시) | P0 (Must) | FR-002 |
| FR-006 | 지출 목록/수정/삭제 | P0 (Must) | FR-002 |
| FR-007 | 카테고리별 지출 통계 | P1 (Should) | FR-002 |
| FR-008 | 오프라인 모드 지원 | P1 (Should) | FR-003 |
| FR-009 | 빠른 입력 (자주 쓰는 카테고리 추천) | P1 (Should) | FR-002 |
| FR-010 | 다중 통화 지원 (여행 중 여러 국가) | P2 (Could) | FR-001 |
| FR-011 | 여행 요약 리포트 | P2 (Could) | FR-007 |
| FR-012 | 음성 입력 | P3 (Won't) | - |

## 4. Non-Functional Requirements

### 4.1 Performance
- 앱 시작 시간: < 2초
- 지출 입력 → 저장: < 500ms
- 환율 API 호출: 일 1회 (앱 시작 시 캐시 만료 확인)

### 4.2 Offline Support
- SQLite로 로컬 데이터 저장
- 환율은 마지막 캐시된 값 사용
- 온라인 복귀 시 자동 동기화

### 4.3 Security
- 로컬 데이터만 저장 (서버 없음, MVP)
- 민감 정보 없음 (금융 연동 X)

### 4.4 Usability
- 지출 입력: 3탭 이내 완료
- 큰 버튼, 명확한 피드백
- 다크모드 지원

## 5. Technical Design

### 5.1 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 52+ |
| Language | TypeScript |
| State | Zustand |
| Storage | expo-sqlite |
| UI | React Native + Tailwind (NativeWind) |
| Navigation | Expo Router |
| Exchange Rate API | ExchangeRate-API (무료) |

### 5.2 Data Schema

```typescript
// 여행
interface Trip {
  id: string;
  name: string;           // "일본 도쿄 여행"
  countries: string[];    // ["JP"]
  currencies: string[];   // ["JPY"]
  startDate: string;      // ISO date
  endDate: string;
  budget?: number;        // 예산 (원화)
  createdAt: string;
}

// 지출
interface Expense {
  id: string;
  tripId: string;
  amount: number;         // 현지 통화 금액
  currency: string;       // "JPY"
  amountKRW: number;      // 원화 환산
  exchangeRate: number;   // 적용된 환율
  category: Category;
  memo?: string;
  date: string;           // ISO date
  createdAt: string;
}

// 카테고리
type Category =
  | 'food'        // 식비
  | 'transport'   // 교통
  | 'shopping'    // 쇼핑
  | 'lodging'     // 숙박
  | 'activity'    // 관광/액티비티
  | 'etc';        // 기타

// 환율 캐시
interface ExchangeRateCache {
  base: 'KRW';
  rates: Record<string, number>;  // { "JPY": 0.0925, "USD": 0.00071 }
  lastUpdated: string;            // ISO datetime
}
```

### 5.3 Exchange Rate API

**선택: ExchangeRate-API (무료 플랜)**
- 월 1,500회 무료
- 일별 1회 호출이면 충분
- 대안: Open Exchange Rates, Fixer.io

```typescript
// API 호출 예시
GET https://v6.exchangerate-api.com/v6/{API_KEY}/latest/KRW

// Response
{
  "result": "success",
  "base_code": "KRW",
  "rates": {
    "JPY": 0.0925,
    "USD": 0.00071,
    "EUR": 0.00065
    // ...
  }
}
```

**환율 캐싱 전략:**
1. 앱 시작 시 캐시 만료 확인 (24시간)
2. 만료 시 API 호출 → SQLite 저장
3. 오프라인이면 캐시된 환율 사용
4. 지출 저장 시 적용된 환율도 함께 저장 (나중에 환율 바뀌어도 원본 유지)

### 5.4 App Structure

```
app/
├── (tabs)/
│   ├── index.tsx          # 홈 (현재 여행 요약)
│   ├── calendar.tsx       # 캘린더 뷰
│   ├── stats.tsx          # 통계
│   └── settings.tsx       # 설정
├── trip/
│   ├── [id].tsx           # 여행 상세
│   └── new.tsx            # 새 여행
├── expense/
│   ├── new.tsx            # 지출 입력 (모달)
│   └── [id].tsx           # 지출 수정
└── _layout.tsx

components/
├── ExpenseInput.tsx       # 빠른 입력 컴포넌트
├── CalendarDay.tsx        # 캘린더 날짜 셀
├── CategoryPicker.tsx     # 카테고리 선택
├── CurrencyInput.tsx      # 통화 입력
└── TripCard.tsx           # 여행 카드

lib/
├── db/
│   ├── schema.ts          # SQLite 스키마
│   └── queries.ts         # DB 쿼리
├── api/
│   └── exchangeRate.ts    # 환율 API
├── stores/
│   ├── tripStore.ts       # 여행 상태
│   └── expenseStore.ts    # 지출 상태
└── utils/
    ├── currency.ts        # 환율 계산
    └── date.ts            # 날짜 유틸
```

## 6. UI/UX Design

### 6.1 핵심 화면

**1. 홈 화면**
- 현재 진행 중인 여행 카드
- 오늘 지출 요약
- 빠른 지출 입력 버튼 (FAB)

**2. 빠른 입력 모달**
```
┌─────────────────────────────┐
│  🇯🇵 일본 여행              │
│                             │
│  ┌─────────────────────┐    │
│  │     ¥ 1,500         │    │  ← 큰 숫자 입력
│  │     ≈ ₩13,500       │    │  ← 실시간 원화 변환
│  └─────────────────────┘    │
│                             │
│  [🍽️식비] [🚃교통] [🛍️쇼핑] │  ← 카테고리 버튼
│  [🏨숙박] [🎡관광] [📦기타] │
│                             │
│  메모 (선택): ____________   │
│                             │
│      [ 저장하기 ]           │
└─────────────────────────────┘
```

**3. 캘린더 뷰**
- 월별 캘린더
- 날짜별 총 지출 금액 표시
- 탭하면 해당 날짜 지출 목록

**4. 통계**
- 카테고리별 파이차트
- 일별 지출 막대그래프
- 총 지출 / 예산 대비

### 6.2 디자인 원칙

- **간편함 우선**: 지출 입력은 10초 이내
- **큰 터치 타겟**: 최소 48x48dp
- **명확한 피드백**: 저장 시 햅틱 + 토스트
- **다크모드**: 밤에 여행 중 사용 고려

## 7. Implementation Phases

### Phase 1: MVP Core
- [x] Expo 프로젝트 셋업
- [ ] SQLite 스키마 및 기본 쿼리
- [ ] 여행 CRUD
- [ ] 지출 CRUD
- [ ] 환율 API 연동 + 캐싱
- [ ] 자동 환율 변환

**Deliverable**: 기본 지출 입력 + 원화 변환 동작

### Phase 2: UI Polish
- [ ] 캘린더 뷰 구현
- [ ] 빠른 입력 모달
- [ ] 카테고리 선택 UI
- [ ] 다크모드

**Deliverable**: 완성된 UI/UX

### Phase 3: Statistics & Offline
- [ ] 카테고리별 통계
- [ ] 일별 지출 차트
- [ ] 오프라인 완전 지원
- [ ] 여행 요약 리포트

**Deliverable**: 통계 기능 + 오프라인 지원

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| 지출 입력 시간 | < 10초 | 사용자 테스트 |
| 앱 시작 시간 | < 2초 | 성능 측정 |
| 오프라인 동작 | 100% | 테스트 |
| 환율 정확도 | 일별 최신 | API 확인 |

## 9. Open Questions

1. ~~환율 API 주기~~ → **일별 1회 + 캐싱**으로 결정
2. ~~카드 연동~~ → **불가, 수동 입력**으로 결정
3. 예산 기능 필요 여부? → Phase 2에서 고려
4. 영수증 OCR 추가 여부? → Phase 3 이후 고려

## 10. Appendix

### A. 지원 통화 (MVP)

| 국가 | 코드 | 기호 |
|------|------|------|
| 일본 | JPY | ¥ |
| 미국 | USD | $ |
| 유럽 | EUR | € |
| 태국 | THB | ฿ |
| 베트남 | VND | ₫ |
| 대만 | TWD | NT$ |
| 중국 | CNY | ¥ |
| 영국 | GBP | £ |
| 호주 | AUD | A$ |
| 싱가포르 | SGD | S$ |

### B. 경쟁 앱 분석

| 앱 | 장점 | 단점 |
|-----|------|------|
| Trabee Pocket | 환율 자동변환 | UI 복잡 |
| Trail Wallet | 예쁜 디자인 | iOS만, 유료 |
| 편한가계부 | 기능 많음 | 여행 특화 X |

**차별점**: 여행 특화 + 극도의 간편함 + 무료
