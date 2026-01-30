<div align="center">

# WIGEX (위젝스)

**WIGTN Expense** - 해외 여행 중 지출을 쉽게 기록하고 관리하는 모바일 앱

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9%2B-orange.svg)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-54-black.svg)](https://expo.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)

[English](./README.md) | 한국어

</div>

---

## 아키텍처

이 프로젝트는 **모노레포(Monorepo) + MSA(Microservices Architecture)** 패턴을 따릅니다. 여러 개의 독립적인 서비스/앱이 하나의 저장소에서 관리됩니다.

> **모노레포란?** 모놀리식(Monolithic)과는 다릅니다. 각 서비스는 독립적으로 배포 가능한 MSA 구조이지만, 코드 저장소(Repository)만 하나로 통합하여 관리하는 방식입니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                         WIGEX Monorepo                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Mobile    │  │     API     │  │    Admin    │             │
│  │  (Expo/RN)  │  │  (NestJS)   │  │  (Next.js)  │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│                  ┌───────┴───────┐                              │
│                  │    Shared     │                              │
│                  │ (TypeScript)  │                              │
│                  └───────────────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 모노레포의 장점

| 장점 | 설명 |
|------|------|
| **단일 진실 공급원 (SSOT)** | 모든 서비스에서 공유 타입과 상수를 일관되게 사용 |
| **원자적 변경** | 여러 서비스의 변경사항을 한 번의 커밋으로 처리 |
| **의존성 관리 단순화** | pnpm workspaces로 통합 의존성 관리 |
| **일관된 도구 사용** | 동일한 린트, 테스트, 빌드 설정 |

---

## 프로젝트 구조

```
wigex/
├── apps/
│   ├── mobile/          # React Native (Expo) - 모바일 앱
│   │   ├── app/         # 파일 기반 라우팅 (Expo Router)
│   │   │   ├── (auth)/  # 인증 화면 (로그인, 회원가입)
│   │   │   ├── (tabs)/  # 탭 네비게이션 (홈, 캘린더, 통계, 설정)
│   │   │   ├── trip/    # 여행 관리 화면
│   │   │   └── expense/ # 지출 관리 화면
│   │   ├── components/  # UI 컴포넌트 (23개)
│   │   │   ├── ui/      # 기본 UI 컴포넌트
│   │   │   ├── expense/ # 지출 관련 컴포넌트
│   │   │   └── layer/   # 레이어 컴포넌트
│   │   ├── lib/
│   │   │   ├── api/     # API 클라이언트 (인증, 여행, 지출, 동기화)
│   │   │   ├── db/      # SQLite 로컬 데이터베이스
│   │   │   ├── stores/  # Zustand 상태 관리
│   │   │   ├── hooks/   # 커스텀 React 훅
│   │   │   ├── utils/   # 유틸리티 함수
│   │   │   ├── theme/   # 테마 설정
│   │   │   └── services/# 토큰 및 네트워크 서비스
│   │   └── assets/      # 이미지, 아이콘
│   │
│   ├── api/             # NestJS - 백엔드 API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/          # JWT 인증
│   │   │   │   ├── user/          # 사용자 관리
│   │   │   │   ├── trip/          # 여행 및 목적지 관리
│   │   │   │   ├── expense/       # 지출 기록
│   │   │   │   ├── wallet/        # 지갑 및 거래
│   │   │   │   ├── exchange-rate/ # 환율 정보
│   │   │   │   ├── ai/            # AI 기능 (OCR, 챗봇)
│   │   │   │   ├── sync/          # 데이터 동기화
│   │   │   │   ├── queue/         # AWS SQS 비동기 처리
│   │   │   │   └── health/        # 헬스 체크 엔드포인트
│   │   │   └── database/          # Prisma ORM 통합
│   │   └── prisma/                # 데이터베이스 스키마 및 마이그레이션
│   │
│   └── admin/           # Next.js - 관리자 대시보드
│       ├── src/
│       │   ├── app/
│       │   │   ├── login/         # 관리자 로그인
│       │   │   └── dashboard/     # 대시보드 페이지
│       │   │       ├── users/     # 회원 관리
│       │   │       ├── ai/        # AI 사용량 모니터링
│       │   │       ├── traffic/   # API 트래픽 모니터링
│       │   │       ├── system/    # 시스템 상태
│       │   │       └── settings/  # 설정
│       │   ├── components/        # UI 컴포넌트
│       │   └── store/             # Zustand 상태
│       └── ...
│
├── packages/
│   └── shared/          # 공유 TypeScript 타입 및 상수
│       └── src/
│           ├── types/   # 타입 정의 (user, trip, expense 등)
│           └── constants.ts  # 전역 상수
│
├── docker/              # Docker 설정 파일
│   ├── docker-compose.local.yml   # 로컬 개발용
│   ├── docker-compose.dev.yml     # 개발 환경용
│   └── docker-compose.prod.yml    # 프로덕션 환경용
│
└── .github/             # GitHub Actions CI/CD
```

---

## 기술 스택

### 모바일 앱 (`apps/mobile`)

| 분류 | 기술 |
|------|------|
| 프레임워크 | React Native 0.81 + Expo 54 |
| 언어 | TypeScript 5.9 |
| 네비게이션 | Expo Router 6 (파일 기반) |
| 상태 관리 | Zustand 5 |
| 로컬 DB | SQLite (expo-sqlite) |
| UI 컴포넌트 | Expo Vector Icons, React Native Chart Kit |
| 카메라/이미지 | expo-camera, expo-image-picker |
| 보안 저장소 | expo-secure-store |

### 백엔드 API (`apps/api`)

| 분류 | 기술 |
|------|------|
| 프레임워크 | NestJS 10 |
| 언어 | TypeScript 5.7 |
| ORM | Prisma 6 |
| 데이터베이스 | PostgreSQL 16 |
| 인증 | Passport.js + JWT |
| 유효성 검사 | class-validator, class-transformer |
| 큐 | AWS SQS |
| API 문서 | Swagger (OpenAPI) |

### 관리자 대시보드 (`apps/admin`)

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript 5.9 |
| UI 프레임워크 | React 19 |
| 스타일링 | Tailwind CSS 3.4 |
| 컴포넌트 | Radix UI |
| 차트 | Recharts 2 |
| 상태 관리 | Zustand 5 |
| 아이콘 | Lucide React |

### DevOps & 도구

| 분류 | 기술 |
|------|------|
| 패키지 매니저 | pnpm 9 + Workspaces |
| 모노레포 도구 | Turbo |
| 컨테이너화 | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| 코드 품질 | ESLint, Prettier |

---

## 주요 기능

### 모바일 앱

| 기능 | 설명 |
|------|------|
| **여행 관리** | 여행 생성 및 예산 설정 |
| **지출 기록** | 실시간 환율 환산과 함께 지출 기록 |
| **영수증 OCR** | AI 기반 영수증 스캔 및 자동 입력 |
| **통계** | 카테고리별 파이차트, 예산 추적 |
| **캘린더 뷰** | 월별 지출 현황 |
| **오프라인 지원** | SQLite 로컬 저장 + 동기화 기능 |
| **다크 모드** | 시스템 테마 자동 감지 |
| **햅틱 피드백** | 향상된 터치 반응성 |

### 지원 통화 (18개)

`JPY` `USD` `EUR` `GBP` `CNY` `THB` `VND` `TWD` `PHP` `SGD` `AUD` `CAD` `CHF` `CZK` `HKD` `MYR` `NZD` `IDR`

### 지출 카테고리 (6개)

| 카테고리 | 아이콘 | 설명 |
|----------|--------|------|
| 식비 | 🍔 | 음식, 음료, 카페 |
| 교통 | 🚗 | 택시, 대중교통, 렌터카 |
| 쇼핑 | 🛍️ | 쇼핑, 기념품 |
| 숙박 | 🏨 | 호텔, 에어비앤비 |
| 관광 | 🎢 | 입장료, 액티비티 |
| 기타 | 📦 | 그 외 모든 지출 |

---

## 시작하기

### 사전 요구사항

- **Node.js** 20.0.0 이상
- **pnpm** 9.0.0 이상
- **Docker** (로컬 데이터베이스용)
- **Expo Go** 앱 (모바일 테스트용)

### 설치

```bash
# 저장소 클론
git clone https://github.com/wigtn/wigex.git
cd wigex

# 의존성 설치
pnpm install

# 공유 패키지 빌드
pnpm --filter @wigtn/shared build

# Prisma 클라이언트 생성
pnpm db:generate
```

### 환경 변수 설정

```bash
# 환경 변수 파일 복사
cp .env.example .env.local
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```

### 서비스 실행

#### 방법 1: 모든 서비스 실행

```bash
# PostgreSQL 데이터베이스 시작
pnpm docker:local

# 데이터베이스 마이그레이션 실행
pnpm db:migrate

# 모든 서비스 시작 (API + Admin + Mobile)
pnpm dev
```

#### 방법 2: 개별 서비스 실행

```bash
# 모바일 앱만
pnpm dev:mobile

# API 서버만
pnpm dev:api

# 관리자 대시보드만
pnpm dev:admin
```

### 모바일 앱 테스트

```bash
# Expo 개발 서버 시작
pnpm dev:mobile

# 또는 apps/mobile에서 직접 실행
cd apps/mobile
npx expo start

# 'i' 키: iOS 시뮬레이터
# 'a' 키: Android 에뮬레이터
# QR 코드 스캔: Expo Go 앱으로 실제 기기에서 테스트
```

---

## 스크립트 참조

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 모든 서비스를 개발 모드로 실행 |
| `pnpm dev:mobile` | 모바일 앱 실행 |
| `pnpm dev:api` | API 서버 실행 |
| `pnpm dev:admin` | 관리자 대시보드 실행 |
| `pnpm build` | 모든 패키지 빌드 |
| `pnpm lint` | ESLint 실행 |
| `pnpm test` | 테스트 실행 |
| `pnpm typecheck` | TypeScript 타입 검사 |
| `pnpm docker:local` | 로컬 PostgreSQL 시작 |
| `pnpm docker:local:down` | 로컬 PostgreSQL 중지 |
| `pnpm db:migrate` | Prisma 마이그레이션 실행 |
| `pnpm db:studio` | Prisma Studio 열기 |
| `pnpm db:generate` | Prisma 클라이언트 생성 |

### 워크스페이스별 명령어

```bash
# 특정 워크스페이스에서 명령어 실행
pnpm --filter @wigtn/mobile <command>
pnpm --filter @wigtn/api <command>
pnpm --filter @wigtn/admin <command>
pnpm --filter @wigtn/shared <command>

# 단축 명령어
pnpm mobile <command>
pnpm api <command>
pnpm admin <command>
pnpm shared <command>
```

---

## API 문서

API 서버가 실행 중일 때 Swagger 문서를 확인할 수 있습니다:

```
http://localhost:3000/api/docs
```

### 주요 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/auth/register` | POST | 회원가입 |
| `/api/auth/login` | POST | 로그인 |
| `/api/auth/refresh` | POST | 액세스 토큰 갱신 |
| `/api/trips` | GET/POST | 여행 관리 |
| `/api/trips/:id/expenses` | GET/POST | 지출 관리 |
| `/api/exchange-rates` | GET | 환율 정보 |
| `/api/ai/receipt/analyze` | POST | 영수증 OCR 분석 |
| `/api/sync/push` | POST | 로컬 변경사항 푸시 |
| `/api/sync/pull` | GET | 서버 변경사항 풀 |

---

## 배포

### Docker 배포

```bash
# 개발 환경
pnpm docker:dev

# 프로덕션 환경
pnpm docker:prod
```

### 환경 변수

필요한 환경 변수는 각 앱 디렉토리의 `.env.example` 파일을 참조하세요.

---

## 기여하기

1. 저장소 Fork
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

---

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

```
MIT License

Copyright (c) 2026 WIGTN Crew

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

Made with ❤️ by **WIGTN Crew**

</div>
