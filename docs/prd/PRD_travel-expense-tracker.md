# Travel Expense Tracker PRD

> **Version**: 1.1 (Simplified)
> **Created**: 2026-01-18
> **Updated**: 2026-01-23
> **Status**: Draft
> **Platform**: Expo React Native

## 1. Overview

### 1.1 Problem Statement

해외 여행 중 지출을 기록할 때:

- 어느 나라에서 얼마를 썼는지 헷갈림
- 현지 통화와 원화를 오가며 파악하기 어려움
- 하루에 여러 나라를 방문하는 경우 (경유, 국경 이동) 지출 정리가 복잡함

### 1.2 Goals

- **단순한 지출 기록**: 금액, 카테고리, 메모만 입력
- **통화 토글**: 현지통화 ↔ 원화 한 번에 전환해서 보기
- **다중 국가 지원**: 하루에 여러 국가 방문해도 깔끔하게 관리
- **오프라인 사용**: 인터넷 없이도 기록 가능

### 1.3 Non-Goals (Out of Scope)

- ❌ 지갑/환전 관리 (환전 금액 입력 X)
- ❌ 카드사/은행 연동
- ❌ 백엔드 서버/회원가입
- ❌ 예산 관리 (복잡한 기능)
- ❌ 다국어 지원 (한국어만)

### 1.4 Scope

| 포함                             | 제외           |
| -------------------------------- | -------------- |
| 여행 일정 (기간, 방문 국가)      | 지갑/환전 관리 |
| 지출 기록 (금액, 카테고리, 메모) | 예산 계획      |
| 원화/현지통화 토글 보기          | 카드 연동      |
| 다중 국가 레이어 UI              | AI 영수증 OCR  |
| 오프라인 저장                    | 백엔드/동기화  |
| 캘린더 뷰                        | 소셜 기능      |

## 2. User Stories

### 2.1 Primary User

해외 여행을 자주 가는 20-40대 한국인 여행자

### 2.2 User Stories

**US-001: 여행 생성**
As a 여행자, I want to 새 여행을 만들고 방문 국가/기간을 설정 so that 해당 여행의 지출을 관리할 수 있다.

**US-002: 지출 입력**
As a 여행자, I want to 현지 통화 금액을 빠르게 입력 so that 복잡한 과정 없이 기록할 수 있다.

**US-003: 통화 토글**
As a 여행자, I want to 지출 목록을 원화/현지통화로 토글해서 보기 so that 원하는 기준으로 확인할 수 있다.

**US-004: 다중 국가 지출**
As a 여행자, I want to 하루에 여러 국가에서 쓴 지출을 구분해서 기록 so that 경유지나 국경 이동 시에도 정확히 기록된다.

**US-005: 일별 지출 확인**
As a 여행자, I want to 캘린더에서 날짜별 지출을 확인 so that 언제 얼마를 썼는지 한눈에 파악할 수 있다.

### 2.3 Acceptance Criteria (Gherkin)

```gherkin
Scenario: 지출 입력
  Given 일본-태국 여행 중
  When 사용자가 도쿄에서 "1500엔" 입력하고 "식비" 선택
  Then 1500 JPY가 저장되고
  And 원화 환산값이 함께 표시됨

Scenario: 통화 토글
  Given 지출 목록에 JPY, THB 지출이 있을 때
  When 사용자가 "원화로 보기" 토글
  Then 모든 지출이 원화(KRW)로 환산되어 표시
  When 사용자가 "현지통화로 보기" 토글
  Then 각 지출이 원래 통화(JPY, THB)로 표시

Scenario: 하루 다중 국가
  Given 1월 20일에 도쿄 → 방콕 이동
  When 도쿄에서 점심(JPY), 방콕에서 저녁(THB) 입력
  Then 1월 20일에 두 국가 레이어로 지출 표시
  And 각 국가별 소계 확인 가능
```

## 3. Functional Requirements

| ID     | Requirement                                  | Priority    | Dependencies   |
| ------ | -------------------------------------------- | ----------- | -------------- |
| FR-001 | 여행 생성 (이름, 기간, 방문 국가 목록)       | P0 (Must)   | -              |
| FR-002 | 방문지 추가/수정/삭제 (국가, 통화, 기간)     | P0 (Must)   | FR-001         |
| FR-003 | 지출 입력 (금액, 통화, 카테고리, 메모, 날짜) | P0 (Must)   | FR-001         |
| FR-004 | 지출 목록/수정/삭제                          | P0 (Must)   | FR-003         |
| FR-005 | 실시간 환율 API 연동 (일별 캐싱)             | P0 (Must)   | -              |
| FR-006 | 원화 환산 및 저장                            | P0 (Must)   | FR-003, FR-005 |
| FR-007 | **통화 토글 (원화 ↔ 현지통화)**              | P0 (Must)   | FR-003         |
| FR-008 | **다중 국가 레이어 UI**                      | P0 (Must)   | FR-002, FR-003 |
| FR-009 | 캘린더 뷰 (날짜별 지출 표시)                 | P0 (Must)   | FR-003         |
| FR-010 | 오프라인 모드 (캐시된 환율 사용)             | P1 (Should) | FR-005         |
| FR-011 | 카테고리별 통계                              | P1 (Should) | FR-003         |
| FR-012 | 국가별 지출 통계                             | P1 (Should) | FR-002, FR-003 |
| FR-013 | 다크모드                                     | P2 (Could)  | -              |

## 4. Non-Functional Requirements

### 4.1 Performance

- 앱 시작 시간: < 2초
- 지출 입력 → 저장: < 500ms
- 환율 API 호출: 일 1회 (앱 시작 시 캐시 만료 확인)

### 4.2 Offline Support

- SQLite로 로컬 데이터 저장
- 환율은 마지막 캐시된 값 사용
- 인터넷 없이도 모든 기능 사용 가능

### 4.3 Security

- 로컬 데이터만 저장 (서버 없음)
- 민감 정보 없음

### 4.4 Usability

- 지출 입력: 3탭 이내 완료
- 큰 터치 타겟 (최소 48x48dp)
- 명확한 피드백: 저장 시 햅틱 + 토스트

## 5. Technical Design

### 5.1 Tech Stack

| Layer             | Technology                           |
| ----------------- | ------------------------------------ |
| Framework         | Expo SDK 52+                         |
| Language          | TypeScript                           |
| State             | Zustand                              |
| Storage           | expo-sqlite                          |
| UI                | React Native + NativeWind (Tailwind) |
| Navigation        | Expo Router                          |
| Exchange Rate API | ExchangeRate-API (무료)              |

### 5.2 Data Schema

```typescript
// 여행
interface Trip {
  id: string;
  name: string; // "일본-태국 여행"
  startDate: string; // ISO date
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

// 방문지 (여행 내 국가별 기간)
interface Destination {
  id: string;
  tripId: string;
  country: string; // "JP"
  countryName: string; // "일본"
  currency: string; // "JPY"
  startDate: string; // 해당 국가 방문 시작
  endDate: string; // 해당 국가 방문 종료
  order: number; // 방문 순서
}

// 지출
interface Expense {
  id: string;
  tripId: string;
  destinationId: string; // 어느 방문지(국가)에서 썼는지
  amount: number; // 현지 통화 금액
  currency: string; // "JPY"
  amountKRW: number; // 원화 환산 (저장 시점 환율)
  exchangeRate: number; // 적용된 환율
  category: Category;
  memo?: string;
  date: string; // ISO date
  createdAt: string;
  updatedAt: string;
}

// 카테고리
type Category =
  | "food" // 식비
  | "transport" // 교통
  | "shopping" // 쇼핑
  | "lodging" // 숙박
  | "activity" // 관광/액티비티
  | "etc"; // 기타

// 환율 캐시
interface ExchangeRateCache {
  base: "KRW";
  rates: Record<string, number>; // { "JPY": 0.0925, "USD": 0.00071 }
  lastUpdated: string; // ISO datetime
}
```

### 5.3 핵심 기능: 통화 토글

```typescript
// 통화 표시 모드
type CurrencyDisplayMode = "local" | "krw";

// Zustand store
interface ExpenseStore {
  displayMode: CurrencyDisplayMode;
  toggleDisplayMode: () => void;

  // 지출 표시 금액 getter
  getDisplayAmount: (expense: Expense) => {
    amount: number;
    currency: string;
    symbol: string;
  };
}

// 토글 시 행동
// 'local': expense.amount + expense.currency (예: ¥1,500)
// 'krw': expense.amountKRW + 'KRW' (예: ₩13,500)
```

### 5.4 핵심 기능: 다중 국가 레이어

```
┌─────────────────────────────────────┐
│  1월 20일 (토)                       │
├─────────────────────────────────────┤
│                                     │
│  🇯🇵 도쿄                             │
│  ┌─────────────────────────────────┐│
│  │ 🍽️ 점심 라멘         ¥1,200     ││
│  │ 🚃 지하철             ¥280      ││
│  │ ─────────────────────────────  ││
│  │                  소계 ¥1,480   ││
│  └─────────────────────────────────┘│
│                                     │
│  🇹🇭 방콕                             │
│  ┌─────────────────────────────────┐│
│  │ 🍽️ 저녁 팟타이       ฿150       ││
│  │ 🚕 그랩              ฿89        ││
│  │ ─────────────────────────────  ││
│  │                  소계 ฿239     ││
│  └─────────────────────────────────┘│
│                                     │
│  💰 1월 20일 총계: ₩25,800          │
│                                     │
└─────────────────────────────────────┘
```

**레이어 프레임 로직:**

```typescript
// 특정 날짜의 지출을 국가별로 그룹화
function groupExpensesByCountry(
  expenses: Expense[],
  destinations: Destination[],
  date: string,
): Map<Destination, Expense[]> {
  const dayExpenses = expenses.filter((e) => e.date === date);
  const grouped = new Map<Destination, Expense[]>();

  for (const expense of dayExpenses) {
    const dest = destinations.find((d) => d.id === expense.destinationId);
    if (dest) {
      const list = grouped.get(dest) || [];
      list.push(expense);
      grouped.set(dest, list);
    }
  }

  return grouped;
}
```

### 5.5 App Structure

```
app/
├── (tabs)/
│   ├── index.tsx          # 홈 (현재 여행 요약)
│   ├── calendar.tsx       # 캘린더 뷰
│   ├── stats.tsx          # 통계
│   └── settings.tsx       # 설정
├── trip/
│   ├── [id]/
│   │   ├── index.tsx      # 여행 상세
│   │   ├── destinations.tsx # 방문지 관리
│   │   └── day/[date].tsx # 일별 상세 (레이어 뷰)
│   └── new.tsx            # 새 여행
├── expense/
│   ├── new.tsx            # 지출 입력 (모달)
│   └── [id].tsx           # 지출 수정
└── _layout.tsx

components/
├── expense/
│   ├── ExpenseInput.tsx       # 지출 입력 폼
│   ├── ExpenseList.tsx        # 지출 목록
│   ├── ExpenseItem.tsx        # 지출 아이템
│   └── CurrencyToggle.tsx     # 통화 토글 버튼
├── trip/
│   ├── TripCard.tsx           # 여행 카드
│   └── DestinationBadge.tsx   # 방문지 배지
├── calendar/
│   ├── CalendarView.tsx       # 캘린더 컴포넌트
│   └── CalendarDay.tsx        # 날짜 셀
├── layer/
│   ├── DayLayerView.tsx       # 일별 국가 레이어 뷰
│   └── CountryLayer.tsx       # 국가별 레이어 카드
└── ui/
    ├── CategoryPicker.tsx     # 카테고리 선택
    └── AmountInput.tsx        # 금액 입력

lib/
├── db/
│   ├── schema.ts          # SQLite 스키마
│   └── queries.ts         # DB 쿼리
├── api/
│   └── exchangeRate.ts    # 환율 API
├── stores/
│   ├── tripStore.ts       # 여행 상태
│   ├── expenseStore.ts    # 지출 상태
│   └── settingsStore.ts   # 설정 (통화 토글 모드 등)
└── utils/
    ├── currency.ts        # 환율 계산, 포맷팅
    └── date.ts            # 날짜 유틸
```

## 6. UI/UX Design

### 6.1 핵심 화면

**1. 홈 화면**

```
┌─────────────────────────────────────┐
│  Travel Helper                 [⚙️] │
├─────────────────────────────────────┤
│                                     │
│  🌏 진행 중인 여행                   │
│  ┌─────────────────────────────────┐│
│  │ 🇯🇵🇹🇭 일본-태국 여행              ││
│  │ 1/18 - 1/25 (D+3)              ││
│  │                                 ││
│  │ 오늘 지출: ₩45,000              ││
│  │ 총 지출: ₩285,000               ││
│  └─────────────────────────────────┘│
│                                     │
│  📅 오늘의 지출                      │
│  ┌─────────────────────────────────┐│
│  │ [원화] / 현지통화     ← 토글     ││
│  │ ─────────────────────────────  ││
│  │ 🇯🇵 도쿄                         ││
│  │   🍽️ 라멘          ₩13,500      ││
│  │   🚃 지하철         ₩2,500       ││
│  │ 🇹🇭 방콕                         ││
│  │   🍽️ 팟타이         ₩5,500       ││
│  └─────────────────────────────────┘│
│                                     │
│              [ ＋ ]                 │  ← FAB: 지출 추가
│                                     │
└─────────────────────────────────────┘
```

**2. 지출 입력 모달**

```
┌─────────────────────────────────────┐
│  [X]        지출 입력               │
├─────────────────────────────────────┤
│                                     │
│  📍 어디서?                          │
│  ┌─────────┐ ┌─────────┐            │
│  │[🇯🇵도쿄]│ │ 🇹🇭방콕 │            │
│  └─────────┘ └─────────┘            │
│                                     │
│  💰 금액                            │
│  ┌─────────────────────────────┐   │
│  │         ¥ 1,500             │   │  ← 큰 숫자 입력
│  │       ≈ ₩13,500             │   │  ← 실시간 원화 환산
│  └─────────────────────────────┘   │
│                                     │
│  🏷️ 카테고리                        │
│  ┌─────┐┌─────┐┌─────┐┌─────┐      │
│  │[🍽️]││ 🚃  ││ 🛍️  ││ 🏨  │      │
│  │식비 ││교통 ││쇼핑 ││숙박 │      │
│  └─────┘└─────┘└─────┘└─────┘      │
│  ┌─────┐┌─────┐                    │
│  │ 🎡  ││ 📦  │                    │
│  │관광 ││기타 │                    │
│  └─────┘└─────┘                    │
│                                     │
│  📝 메모 (선택)                      │
│  ┌─────────────────────────────┐   │
│  │ 신주쿠 이치란 라멘             │   │
│  └─────────────────────────────┘   │
│                                     │
│  📅 날짜                            │
│  ┌─────────────────────────────┐   │
│  │ 2026년 1월 20일          ▼   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │          저장하기              │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**3. 일별 상세 (레이어 뷰)**

```
┌─────────────────────────────────────┐
│  [<]     1월 20일 (토)        [편집] │
├─────────────────────────────────────┤
│                                     │
│  [원화] / 현지통화                   │  ← 통화 토글
│                                     │
│  🇯🇵 도쿄                    ₩16,000 │
│  ┌─────────────────────────────────┐│
│  │ 🍽️ 점심 라멘                     ││
│  │    신주쿠 이치란               ││
│  │                     ₩13,500   ││
│  ├─────────────────────────────────┤│
│  │ 🚃 지하철                        ││
│  │    신주쿠 → 나리타             ││
│  │                      ₩2,500   ││
│  └─────────────────────────────────┘│
│                                     │
│  🇹🇭 방콕                     ₩9,800 │
│  ┌─────────────────────────────────┐│
│  │ 🍽️ 저녁 팟타이                   ││
│  │    카오산로드 노점              ││
│  │                      ₩5,500   ││
│  ├─────────────────────────────────┤│
│  │ 🚕 그랩                          ││
│  │    공항 → 호텔                 ││
│  │                      ₩4,300   ││
│  └─────────────────────────────────┘│
│                                     │
│  ─────────────────────────────────  │
│  💰 1월 20일 총계          ₩25,800  │
│                                     │
│              [ ＋ ]                 │
│                                     │
└─────────────────────────────────────┘
```

**4. 캘린더 뷰**

```
┌─────────────────────────────────────┐
│  [<]      2026년 1월          [>]   │
├─────────────────────────────────────┤
│  일  월  화  수  목  금  토          │
│  ─────────────────────────────────  │
│  ..  ..  ..  15  16  17  18        │
│                          ₩45k      │
│                         🇯🇵        │
│  ─────────────────────────────────  │
│  19  20  21  22  23  24  25        │
│ ₩52k ₩26k ₩38k ₩41k              │
│  🇯🇵 🇯🇵🇹🇭 🇹🇭  🇹🇭                  │
│  ─────────────────────────────────  │
│                                     │
│  📊 여행 요약                        │
│  ┌─────────────────────────────────┐│
│  │ 총 지출: ₩285,000               ││
│  │ 일평균: ₩47,500                 ││
│  │ 가장 많이 쓴 날: 1/19 (₩52k)    ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

### 6.2 디자인 원칙

1. **단순함 우선**: 지출 입력은 10초 이내
2. **국가별 구분 명확**: 국기 이모지 + 컬러 코딩
3. **통화 전환 쉽게**: 토글 버튼 상단 고정
4. **큰 터치 타겟**: 최소 48x48dp
5. **명확한 피드백**: 저장 시 햅틱 + 토스트

## 7. Implementation Phases

### Phase 1: Core MVP

- [ ] Expo 프로젝트 셋업 + NativeWind
- [ ] SQLite 스키마 및 기본 쿼리
- [ ] 여행 CRUD
- [ ] 방문지(Destination) CRUD
- [ ] 지출 CRUD
- [ ] 환율 API 연동 + 캐싱

**Deliverable**: 기본 지출 입력 + 원화 환산 동작

### Phase 2: 핵심 UI

- [ ] 통화 토글 기능
- [ ] 다중 국가 레이어 뷰
- [ ] 캘린더 뷰 구현
- [ ] 지출 입력 모달 UI

**Deliverable**: 핵심 기능 완성

### Phase 3: Polish

- [ ] 카테고리별 통계
- [ ] 국가별 지출 통계
- [ ] 오프라인 완전 지원
- [ ] 다크모드
- [ ] 애니메이션/햅틱 피드백

**Deliverable**: 배포 가능한 앱

## 8. Success Metrics

| Metric         | Target | Measurement   |
| -------------- | ------ | ------------- |
| 지출 입력 시간 | < 10초 | 사용자 테스트 |
| 앱 시작 시간   | < 2초  | 성능 측정     |
| 오프라인 동작  | 100%   | 테스트        |
| 통화 토글 반응 | 즉시   | UI 테스트     |

## 9. Open Questions

1. ~~지갑/환전 기능~~ → **제외** (단순 지출 기록만)
2. ~~AI/OCR~~ → **제외** (향후 별도 버전에서)
3. ~~백엔드/동기화~~ → **제외** (오프라인 전용)
4. 예산 기능? → 향후 고려 (P3)

## 10. Appendix

### A. 지원 통화 (MVP)

| 국가       | 코드 | 기호 |
| ---------- | ---- | ---- |
| 일본       | JPY  | ¥    |
| 미국       | USD  | $    |
| 유럽       | EUR  | €    |
| 태국       | THB  | ฿    |
| 베트남     | VND  | ₫    |
| 대만       | TWD  | NT$  |
| 중국       | CNY  | ¥    |
| 영국       | GBP  | £    |
| 호주       | AUD  | A$   |
| 싱가포르   | SGD  | S$   |
| 홍콩       | HKD  | HK$  |
| 말레이시아 | MYR  | RM   |
| 필리핀     | PHP  | ₱    |
| 인도네시아 | IDR  | Rp   |

### B. 카테고리 아이콘

| Category  | Icon | Label |
| --------- | ---- | ----- |
| food      | 🍽️   | 식비  |
| transport | 🚃   | 교통  |
| shopping  | 🛍️   | 쇼핑  |
| lodging   | 🏨   | 숙박  |
| activity  | 🎡   | 관광  |
| etc       | 📦   | 기타  |

### C. 경쟁앱 대비 차별점

| 기능             | 우리 앱     | 타앱                  |
| ---------------- | ----------- | --------------------- |
| 다중 국가 레이어 | ✅          | ❌ (대부분 단일 국가) |
| 통화 토글        | ✅ 원터치   | ❌ 또는 복잡          |
| 지갑/환전 관리   | ❌ (단순화) | ✅ (복잡)             |
| 오프라인         | ✅ 100%     | 일부만                |

**핵심 차별점**:

- 하루에 여러 국가 방문해도 깔끔하게 관리
- 복잡한 지갑/환전 기능 없이 **단순 지출 기록**에 집중
