<div align="center">

# WIGEX (위젝스)

**WIGTN Expense** - A mobile app for easily recording and managing expenses during overseas travel.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9%2B-orange.svg)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-54-black.svg)](https://expo.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)

[한국어](./README.ko.md) | English

</div>

---

## Architecture

This project follows a **Monorepo + MSA (Microservices Architecture)** pattern. Multiple independent services/apps are managed in a single repository.

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

### Why Monorepo?

| Benefit | Description |
|---------|-------------|
| **Single Source of Truth** | Shared types and constants across all services |
| **Atomic Changes** | Update multiple services in a single commit |
| **Simplified Dependencies** | Unified dependency management with pnpm workspaces |
| **Consistent Tooling** | Same linting, testing, and build configurations |

---

## Project Structure

```
wigex/
├── apps/
│   ├── mobile/          # React Native (Expo) - Mobile App
│   │   ├── app/         # File-based routing (Expo Router)
│   │   │   ├── (auth)/  # Authentication screens
│   │   │   ├── (tabs)/  # Tab navigation (Home, Calendar, Stats, Settings)
│   │   │   ├── trip/    # Trip management screens
│   │   │   └── expense/ # Expense management screens
│   │   ├── components/  # UI components (23 components)
│   │   │   ├── ui/      # Base UI components
│   │   │   ├── expense/ # Expense-related components
│   │   │   └── layer/   # Layer components
│   │   ├── lib/
│   │   │   ├── api/     # API client (auth, trip, expense, sync)
│   │   │   ├── db/      # SQLite local database
│   │   │   ├── stores/  # Zustand state management
│   │   │   ├── hooks/   # Custom React hooks
│   │   │   ├── utils/   # Utility functions
│   │   │   ├── theme/   # Theme configuration
│   │   │   └── services/# Token & network services
│   │   └── assets/      # Images, icons
│   │
│   ├── api/             # NestJS - Backend API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/          # JWT authentication
│   │   │   │   ├── user/          # User management
│   │   │   │   ├── trip/          # Trip & destination management
│   │   │   │   ├── expense/       # Expense records
│   │   │   │   ├── wallet/        # Wallet & transactions
│   │   │   │   ├── exchange-rate/ # Currency exchange rates
│   │   │   │   ├── ai/            # AI features (OCR, chatbot)
│   │   │   │   ├── sync/          # Data synchronization
│   │   │   │   ├── queue/         # AWS SQS async processing
│   │   │   │   └── health/        # Health check endpoints
│   │   │   └── database/          # Prisma ORM integration
│   │   └── prisma/                # Database schema & migrations
│   │
│   └── admin/           # Next.js - Admin Dashboard
│       ├── src/
│       │   ├── app/
│       │   │   ├── login/         # Admin authentication
│       │   │   └── dashboard/     # Dashboard pages
│       │   │       ├── users/     # User management
│       │   │       ├── ai/        # AI usage monitoring
│       │   │       ├── traffic/   # API traffic monitoring
│       │   │       ├── system/    # System status
│       │   │       └── settings/  # Settings
│       │   ├── components/        # UI components
│       │   └── store/             # Zustand state
│       └── ...
│
├── packages/
│   └── shared/          # Shared TypeScript types & constants
│       └── src/
│           ├── types/   # Type definitions (user, trip, expense, etc.)
│           └── constants.ts  # Global constants
│
├── docker/              # Docker configurations
│   ├── docker-compose.local.yml   # Local development
│   ├── docker-compose.dev.yml     # Development environment
│   └── docker-compose.prod.yml    # Production environment
│
└── .github/             # GitHub Actions CI/CD
```

---

## Tech Stack

### Mobile App (`apps/mobile`)

| Category | Technology |
|----------|------------|
| Framework | React Native 0.81 + Expo 54 |
| Language | TypeScript 5.9 |
| Navigation | Expo Router 6 (File-based) |
| State Management | Zustand 5 |
| Local Database | SQLite (expo-sqlite) |
| UI Components | Expo Vector Icons, React Native Chart Kit |
| Camera/Image | expo-camera, expo-image-picker |
| Secure Storage | expo-secure-store |

### Backend API (`apps/api`)

| Category | Technology |
|----------|------------|
| Framework | NestJS 10 |
| Language | TypeScript 5.7 |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 |
| Authentication | Passport.js + JWT |
| Validation | class-validator, class-transformer |
| Queue | AWS SQS |
| Documentation | Swagger (OpenAPI) |

### Admin Dashboard (`apps/admin`)

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.9 |
| UI Framework | React 19 |
| Styling | Tailwind CSS 3.4 |
| Components | Radix UI |
| Charts | Recharts 2 |
| State Management | Zustand 5 |
| Icons | Lucide React |

### DevOps & Tooling

| Category | Technology |
|----------|------------|
| Package Manager | pnpm 9 + Workspaces |
| Monorepo Tool | Turbo |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Code Quality | ESLint, Prettier |

---

## Features

### Mobile App

| Feature | Description |
|---------|-------------|
| **Trip Management** | Create and manage trips with budget settings |
| **Expense Recording** | Record expenses with real-time currency conversion |
| **Receipt OCR** | AI-powered receipt scanning and auto-fill |
| **Statistics** | Category-wise pie charts, budget tracking |
| **Calendar View** | Monthly expense overview |
| **Offline Support** | Local SQLite storage with sync capability |
| **Dark Mode** | System theme detection |
| **Haptic Feedback** | Enhanced touch responsiveness |

### Supported Currencies (18)

`JPY` `USD` `EUR` `GBP` `CNY` `THB` `VND` `TWD` `PHP` `SGD` `AUD` `CAD` `CHF` `CZK` `HKD` `MYR` `NZD` `IDR`

### Expense Categories (6)

| Category | Icon |
|----------|------|
| Food | 🍔 |
| Transport | 🚗 |
| Shopping | 🛍️ |
| Lodging | 🏨 |
| Activity | 🎢 |
| Other | 📦 |

---

## Getting Started

### Prerequisites

- **Node.js** 20.0.0 or higher
- **pnpm** 9.0.0 or higher
- **Docker** (for local database)
- **Expo Go** app (for mobile testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/wigtn/wigex.git
cd wigex

# Install dependencies
pnpm install

# Build shared package
pnpm --filter @wigtn/shared build

# Generate Prisma client
pnpm db:generate
```

### Environment Setup

```bash
# Copy environment files
cp .env.example .env.local
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```

### Running the Services

#### Option 1: Run All Services

```bash
# Start PostgreSQL database
pnpm docker:local

# Run database migrations
pnpm db:migrate

# Start all services (API + Admin + Mobile)
pnpm dev
```

#### Option 2: Run Individual Services

```bash
# Mobile App only
pnpm dev:mobile

# API Server only
pnpm dev:api

# Admin Dashboard only
pnpm dev:admin
```

### Mobile App Testing

```bash
# Start Expo development server
pnpm dev:mobile

# Or run directly in apps/mobile
cd apps/mobile
npx expo start

# Press 'i' for iOS Simulator
# Press 'a' for Android Emulator
# Scan QR code with Expo Go app for physical device
```

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all services in development mode |
| `pnpm dev:mobile` | Run mobile app |
| `pnpm dev:api` | Run API server |
| `pnpm dev:admin` | Run admin dashboard |
| `pnpm build` | Build all packages |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run tests |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm docker:local` | Start local PostgreSQL |
| `pnpm docker:local:down` | Stop local PostgreSQL |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:generate` | Generate Prisma client |

### Workspace-specific Commands

```bash
# Run command in specific workspace
pnpm --filter @wigtn/mobile <command>
pnpm --filter @wigtn/api <command>
pnpm --filter @wigtn/admin <command>
pnpm --filter @wigtn/shared <command>

# Shortcuts
pnpm mobile <command>
pnpm api <command>
pnpm admin <command>
pnpm shared <command>
```

---

## API Documentation

When the API server is running, Swagger documentation is available at:

```
http://localhost:3000/api/docs
```

### Main API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | User login |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/trips` | GET/POST | Trip management |
| `/api/trips/:id/expenses` | GET/POST | Expense management |
| `/api/exchange-rates` | GET | Currency exchange rates |
| `/api/ai/receipt/analyze` | POST | Receipt OCR analysis |
| `/api/sync/push` | POST | Push local changes |
| `/api/sync/pull` | GET | Pull server changes |

---

## Deployment

### Docker Deployment

```bash
# Development
pnpm docker:dev

# Production
pnpm docker:prod
```

### Environment Variables

See `.env.example` files in each app directory for required environment variables.

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

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
