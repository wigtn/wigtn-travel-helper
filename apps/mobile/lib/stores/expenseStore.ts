// Travel Helper v2.0 - Expense Store (API-first with offline support)

import { create } from 'zustand';
import { generateId } from '../utils/uuid';
import { Expense, ExpenseStats, Destination, DayExpenseGroup } from '../types';
import { Category } from '../utils/constants';
import * as queries from '../db/queries';
import { expenseApi, CreateExpenseDto } from '../api/expense';
import { networkService } from '../services/networkService';

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;

  // 액션들
  loadExpenses: (tripId: string) => Promise<void>;
  loadExpensesFromServer: (tripId: string) => Promise<void>;
  createExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpenseById: (id: string) => Promise<Expense | null>;

  // 통계
  getStats: (tripId: string) => ExpenseStats;
  getTotalByTrip: (tripId: string) => Promise<number>;
  getTodayTotal: (
    tripId: string
  ) => Promise<{ totalKRW: number; byCurrency: Record<string, number> }>;
  getExpensesByCurrency: (
    tripId: string
  ) => Promise<Record<string, { amount: number; amountKRW: number }>>;

  // 다중 국가 레이어 (FR-008)
  getExpensesByDateGrouped: (
    tripId: string,
    date: string,
    destinations: Destination[]
  ) => DayExpenseGroup[];
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  isLoading: false,

  // Load expenses from local DB
  loadExpenses: async (tripId) => {
    set({ isLoading: true });
    try {
      const expenses = await queries.getExpensesByTripId(tripId);
      set({ expenses, isLoading: false });
    } catch (error) {
      console.error('Failed to load expenses:', error);
      set({ isLoading: false });
    }
  },

  // Load expenses from server and save to local DB
  loadExpensesFromServer: async (tripId) => {
    if (!networkService.getIsConnected()) {
      return get().loadExpenses(tripId);
    }

    set({ isLoading: true });
    try {
      const { data } = await expenseApi.getByTrip(tripId);

      // Convert server response to local type
      // Server uses expenseDate/expenseTime, client uses date/time
      const expenses: Expense[] = data.map((e: any) => ({
        id: e.id,
        tripId: e.tripId,
        destinationId: e.destinationId,
        amount: Number(e.amount),
        currency: e.currency,
        amountKRW: Number(e.amountKRW),
        exchangeRate: Number(e.exchangeRate),
        category: e.category,
        memo: e.memo,
        date: e.expenseDate
          ? new Date(e.expenseDate).toISOString().split('T')[0]
          : e.date,
        time: e.expenseTime
          ? new Date(e.expenseTime).toISOString().split('T')[1].slice(0, 5)
          : e.time,
        createdAt: e.createdAt,
      }));

      // Upsert to local DB
      for (const expense of expenses) {
        await queries.upsertExpense(expense);
      }

      set({ expenses, isLoading: false });
    } catch (error) {
      console.error('Failed to load expenses from server:', error);
      await get().loadExpenses(tripId);
    }
  },

  createExpense: async (expenseData) => {
    const isOnline = networkService.getIsConnected();
    const expenseId = generateId();
    const now = new Date().toISOString();

    const expense: Expense = {
      ...expenseData,
      id: expenseId,
      createdAt: now,
    };

    if (isOnline) {
      try {
        const dto: CreateExpenseDto = {
          destinationId: expenseData.destinationId,
          amount: expenseData.amount,
          currency: expenseData.currency,
          exchangeRate: expenseData.exchangeRate,
          amountKRW: expenseData.amountKRW,
          category: expenseData.category,
          memo: expenseData.memo,
          expenseDate: expenseData.date,
          expenseTime: expenseData.time,
        };

        const { data } = await expenseApi.create(expenseData.tripId, dto);

        // Use server-generated ID
        expense.id = data.id;
        expense.createdAt = data.createdAt;
      } catch (error) {
        console.error('Failed to create expense on server:', error);
        // Queue for later sync
        await queries.addToSyncQueue(
          'expense',
          expense.id,
          'create',
          expense as unknown as Record<string, unknown>
        );
      }
    } else {
      await queries.addToSyncQueue(
        'expense',
        expense.id,
        'create',
        expense as unknown as Record<string, unknown>
      );
    }

    await queries.createExpense(expense);
    set((state) => ({ expenses: [expense, ...state.expenses] }));
    return expense;
  },

  updateExpense: async (expense) => {
    const isOnline = networkService.getIsConnected();

    if (isOnline) {
      try {
        await expenseApi.update(expense.id, {
          destinationId: expense.destinationId,
          amount: expense.amount,
          currency: expense.currency,
          exchangeRate: expense.exchangeRate,
          amountKRW: expense.amountKRW,
          category: expense.category,
          memo: expense.memo,
          expenseDate: expense.date,
          expenseTime: expense.time,
        });
      } catch (error) {
        console.error('Failed to update expense on server:', error);
        await queries.addToSyncQueue(
          'expense',
          expense.id,
          'update',
          expense as unknown as Record<string, unknown>
        );
      }
    } else {
      await queries.addToSyncQueue(
        'expense',
        expense.id,
        'update',
        expense as unknown as Record<string, unknown>
      );
    }

    await queries.updateExpense(expense);
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === expense.id ? expense : e)),
    }));
  },

  deleteExpense: async (id) => {
    const isOnline = networkService.getIsConnected();

    if (isOnline) {
      try {
        await expenseApi.delete(id);
      } catch (error) {
        console.error('Failed to delete expense on server:', error);
        await queries.addToSyncQueue('expense', id, 'delete', { id });
      }
    } else {
      await queries.addToSyncQueue('expense', id, 'delete', { id });
    }

    await queries.deleteExpense(id);
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    }));
  },

  getExpenseById: async (id) => {
    return await queries.getExpenseById(id);
  },

  getStats: (tripId) => {
    const expenses = get().expenses.filter((e) => e.tripId === tripId);

    const stats: ExpenseStats = {
      totalKRW: 0,
      totalLocal: {},
      byCategory: {} as Record<Category, number>,
      byDate: {},
      byDestination: {},
      byCurrency: {},
    };

    for (const expense of expenses) {
      stats.totalKRW += expense.amountKRW;

      // 통화별 합계
      stats.totalLocal[expense.currency] =
        (stats.totalLocal[expense.currency] || 0) + expense.amount;

      // 카테고리별 (원화 기준)
      stats.byCategory[expense.category] =
        (stats.byCategory[expense.category] || 0) + expense.amountKRW;

      // 날짜별
      stats.byDate[expense.date] =
        (stats.byDate[expense.date] || 0) + expense.amountKRW;

      // 방문지별
      if (expense.destinationId) {
        stats.byDestination[expense.destinationId] =
          (stats.byDestination[expense.destinationId] || 0) + expense.amountKRW;
      }

      // 통화별 상세
      if (!stats.byCurrency[expense.currency]) {
        stats.byCurrency[expense.currency] = { amount: 0, amountKRW: 0 };
      }
      stats.byCurrency[expense.currency].amount += expense.amount;
      stats.byCurrency[expense.currency].amountKRW += expense.amountKRW;
    }

    return stats;
  },

  getTotalByTrip: async (tripId) => {
    return await queries.getTotalExpenseByTrip(tripId);
  },

  getTodayTotal: async (tripId) => {
    return await queries.getTodayExpenseByTrip(tripId);
  },

  getExpensesByCurrency: async (tripId) => {
    return await queries.getExpensesByCurrency(tripId);
  },

  // PRD FR-008: 특정 날짜의 지출을 국가별로 그룹화
  getExpensesByDateGrouped: (tripId, date, destinations) => {
    const dayExpenses = get().expenses.filter(
      (e) => e.tripId === tripId && e.date === date
    );
    const groups: DayExpenseGroup[] = [];

    // 방문지별로 그룹화
    const grouped = new Map<string, Expense[]>();

    for (const expense of dayExpenses) {
      const destId = expense.destinationId || 'unknown';
      const list = grouped.get(destId) || [];
      list.push(expense);
      grouped.set(destId, list);
    }

    // DayExpenseGroup 배열로 변환
    for (const [destId, expenses] of grouped) {
      const destination = destinations.find((d) => d.id === destId);
      if (destination) {
        const totalLocal = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalKRW = expenses.reduce((sum, e) => sum + e.amountKRW, 0);

        groups.push({
          date,
          destination,
          expenses,
          totalLocal,
          totalKRW,
        });
      }
    }

    // 방문 순서대로 정렬
    return groups.sort(
      (a, b) => a.destination.orderIndex - b.destination.orderIndex
    );
  },
}));
