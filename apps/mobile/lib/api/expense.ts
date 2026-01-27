import { apiClient } from './client';
import { Category } from '../utils/constants';

// ============ Types ============

export interface CreateExpenseDto {
  destinationId?: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  amountKRW: number;
  category: Category;
  paymentMethod?: 'card' | 'cash';
  description?: string;
  memo?: string;
  expenseDate: string;
  expenseTime?: string;
}

export interface UpdateExpenseDto {
  destinationId?: string;
  amount?: number;
  currency?: string;
  exchangeRate?: number;
  amountKRW?: number;
  category?: Category;
  paymentMethod?: 'card' | 'cash';
  description?: string;
  memo?: string;
  expenseDate?: string;
  expenseTime?: string;
}

export interface ExpenseFilters {
  category?: Category;
  startDate?: string;
  endDate?: string;
}

export interface ExpenseStats {
  totalKRW: number;
  totalByCategory: Record<Category, number>;
  totalByCurrency: Record<string, { amount: number; amountKRW: number }>;
  dailyTotals: Record<string, number>;
}

// Server response type (different field names from client Expense type)
export interface ExpenseResponse {
  id: string;
  tripId: string;
  userId: string;
  destinationId?: string;
  amount: number | string;
  currency: string;
  exchangeRate: number | string;
  amountKRW: number | string;
  category: Category;
  paymentMethod?: string;
  description?: string;
  memo?: string;
  expenseDate: string; // ISO date string from server
  expenseTime?: string; // ISO time string from server
  createdAt: string;
  updatedAt?: string;
}

// ============ API Functions ============

export const expenseApi = {
  // Get expenses for a trip
  getByTrip: (tripId: string, filters?: ExpenseFilters) =>
    apiClient.get<ExpenseResponse[]>(`/trips/${tripId}/expenses`, {
      params: filters,
    }),

  // Get single expense
  getById: (id: string) =>
    apiClient.get<ExpenseResponse>(`/expenses/${id}`),

  // Create expense
  create: (tripId: string, dto: CreateExpenseDto) =>
    apiClient.post<ExpenseResponse>(`/trips/${tripId}/expenses`, dto),

  // Update expense
  update: (id: string, dto: UpdateExpenseDto) =>
    apiClient.patch<ExpenseResponse>(`/expenses/${id}`, dto),

  // Delete expense
  delete: (id: string) =>
    apiClient.delete(`/expenses/${id}`),

  // Get expense statistics for a trip
  getStats: (tripId: string) =>
    apiClient.get<ExpenseStats>(`/trips/${tripId}/expenses/stats`),
};
