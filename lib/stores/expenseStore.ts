import { create } from 'zustand';
import { generateId } from '../utils/uuid';
import { Expense, ExpenseStats } from '../types';
import { Category } from '../utils/constants';
import * as queries from '../db/queries';

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  loadExpenses: (tripId: string) => Promise<void>;
  createExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getStats: (tripId: string) => ExpenseStats;
  getTotalByTrip: (tripId: string) => Promise<number>;
  getTodayTotal: (tripId: string) => Promise<number>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  isLoading: false,

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

  createExpense: async (expenseData) => {
    const expense: Expense = {
      ...expenseData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await queries.createExpense(expense);
    set((state) => ({ expenses: [expense, ...state.expenses] }));
    return expense;
  },

  updateExpense: async (expense) => {
    await queries.updateExpense(expense);
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === expense.id ? expense : e)),
    }));
  },

  deleteExpense: async (id) => {
    await queries.deleteExpense(id);
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    }));
  },

  getStats: (tripId) => {
    const expenses = get().expenses.filter((e) => e.tripId === tripId);

    const stats: ExpenseStats = {
      totalKRW: 0,
      totalLocal: 0,
      byCategory: {} as Record<Category, number>,
      byDate: {},
    };

    for (const expense of expenses) {
      stats.totalKRW += expense.amountKRW;
      stats.totalLocal += expense.amount;
      stats.byCategory[expense.category] = (stats.byCategory[expense.category] || 0) + expense.amountKRW;
      stats.byDate[expense.date] = (stats.byDate[expense.date] || 0) + expense.amountKRW;
    }

    return stats;
  },

  getTotalByTrip: async (tripId) => {
    return await queries.getTotalExpenseByTrip(tripId);
  },

  getTodayTotal: async (tripId) => {
    return await queries.getTodayExpenseByTrip(tripId);
  },
}));
