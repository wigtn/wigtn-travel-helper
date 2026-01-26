// @wigtn/shared - Wallet Types
// Data Schema Contract SSOT
// NOTE: MVP에서는 제외 (PRD v1.1 Non-Goal)
// 추후 확장을 위해 타입 정의만 유지

import { BaseEntity } from './common';
import { SupportedCurrency } from './exchange-rate';

export type WalletTransactionType = 'deposit' | 'withdraw' | 'adjust';

export interface Wallet extends BaseEntity {
  tripId: string;
  userId: string;
  currency: SupportedCurrency;
  name?: string;
}

export interface WalletTransaction extends BaseEntity {
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  exchangeRate?: number;
  amountKRW?: number;
  memo?: string;
}

export interface WalletWithBalance extends Wallet {
  balance: number;
  totalDeposit: number;
  totalWithdraw: number;
}

// DTOs
export interface CreateWalletDto {
  tripId: string;
  currency: SupportedCurrency;
  name?: string;
  initialDeposit?: number;
  exchangeRate?: number;
}

export interface CreateTransactionDto {
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  exchangeRate?: number;
  memo?: string;
}
