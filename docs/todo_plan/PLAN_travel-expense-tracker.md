# Task Plan: Travel Expense Tracker

> **Generated from**: docs/prd/PRD_travel-expense-tracker.md
> **Created**: 2026-01-18
> **Status**: pending

## Execution Config

| Option | Value | Description |
|--------|-------|-------------|
| `auto_commit` | true | 완료 시 자동 커밋 |
| `commit_per_phase` | true | Phase별 중간 커밋 |
| `quality_gate` | true | /auto-commit 품질 검사 |

## Phases

### Phase 1: 프로젝트 셋업
- [ ] Expo 프로젝트 초기화 (TypeScript 템플릿)
- [ ] 필수 의존성 설치 (expo-sqlite, zustand, nativewind 등)
- [ ] 폴더 구조 생성
- [ ] NativeWind (Tailwind) 설정
- [ ] Expo Router 기본 레이아웃

### Phase 2: 데이터 레이어
- [ ] SQLite 스키마 정의 (trips, expenses, exchange_rates)
- [ ] DB 초기화 및 마이그레이션 설정
- [ ] 기본 CRUD 쿼리 함수
- [ ] Zustand 스토어 설정 (tripStore, expenseStore)

### Phase 3: 환율 API 연동
- [ ] ExchangeRate-API 연동 함수
- [ ] 환율 캐싱 로직 (24시간 만료)
- [ ] 오프라인 시 캐시된 환율 사용
- [ ] 원화 변환 유틸 함수

### Phase 4: 핵심 기능 - 여행 관리
- [ ] 새 여행 생성 화면
- [ ] 국가/통화 선택 UI
- [ ] 여행 목록 화면
- [ ] 여행 상세/수정/삭제

### Phase 5: 핵심 기능 - 지출 관리
- [ ] 빠른 지출 입력 모달
- [ ] 숫자 키패드 + 실시간 원화 변환 표시
- [ ] 카테고리 선택 UI
- [ ] 지출 목록 화면
- [ ] 지출 수정/삭제

### Phase 6: 캘린더 뷰
- [ ] 월별 캘린더 컴포넌트
- [ ] 날짜별 지출 합계 표시
- [ ] 날짜 탭 시 지출 목록 모달

### Phase 7: 통계 & 리포트
- [ ] 카테고리별 파이차트
- [ ] 일별 지출 막대그래프
- [ ] 여행 요약 카드

### Phase 8: 마무리
- [ ] 다크모드 지원
- [ ] 햅틱 피드백 추가
- [ ] 에러 핸들링 개선
- [ ] 성능 최적화
- [ ] 테스트

## Progress

| Metric | Value |
|--------|-------|
| Total Tasks | 0/32 |
| Current Phase | - |
| Status | pending |

## Execution Log

| Timestamp | Phase | Task | Status |
|-----------|-------|------|--------|
| - | - | - | - |
