import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

interface FindAllOptions {
  category?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class ExpenseService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, tripId: string, options: FindAllOptions = {}) {
    // Verify trip ownership
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, userId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const where: any = { tripId, userId };

    if (options.category) {
      where.category = options.category;
    }

    if (options.startDate || options.endDate) {
      where.expenseDate = {};
      if (options.startDate) {
        where.expenseDate.gte = new Date(options.startDate);
      }
      if (options.endDate) {
        where.expenseDate.lte = new Date(options.endDate);
      }
    }

    return this.prisma.expense.findMany({
      where,
      include: {
        destination: true,
        wallet: true,
      },
      orderBy: [{ expenseDate: 'desc' }, { expenseTime: 'desc' }],
    });
  }

  async findOne(userId: string, id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        destination: true,
        wallet: true,
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return expense;
  }

  async create(userId: string, tripId: string, createExpenseDto: CreateExpenseDto) {
    // Verify trip ownership
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, userId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Parse expenseTime safely
    let expenseTime: Date | null = null;
    if (createExpenseDto.expenseTime && createExpenseDto.expenseTime.trim()) {
      const timeStr = createExpenseDto.expenseTime.trim();
      // Handle HH:mm or HH:mm:ss format
      const timeWithSeconds = timeStr.includes(':') && timeStr.split(':').length === 2
        ? `${timeStr}:00`
        : timeStr;
      const parsed = new Date(`1970-01-01T${timeWithSeconds}`);
      if (!isNaN(parsed.getTime())) {
        expenseTime = parsed;
      }
    }

    return this.prisma.expense.create({
      data: {
        tripId,
        userId,
        destinationId: createExpenseDto.destinationId || null,
        amount: createExpenseDto.amount,
        currency: createExpenseDto.currency,
        exchangeRate: createExpenseDto.exchangeRate,
        amountKRW: createExpenseDto.amountKRW,
        category: createExpenseDto.category,
        paymentMethod: createExpenseDto.paymentMethod || 'card',
        description: createExpenseDto.description || null,
        memo: createExpenseDto.memo || null,
        expenseDate: new Date(createExpenseDto.expenseDate),
        expenseTime,
      },
      include: {
        destination: true,
        wallet: true,
      },
    });
  }

  async update(userId: string, id: string, updateExpenseDto: UpdateExpenseDto) {
    await this.findOne(userId, id); // Check ownership

    const data: any = { ...updateExpenseDto };

    if (updateExpenseDto.expenseDate) {
      data.expenseDate = new Date(updateExpenseDto.expenseDate);
    }

    if (updateExpenseDto.expenseTime) {
      data.expenseTime = new Date(`1970-01-01T${updateExpenseDto.expenseTime}`);
    }

    return this.prisma.expense.update({
      where: { id },
      data,
      include: {
        destination: true,
        wallet: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id); // Check ownership

    await this.prisma.expense.delete({
      where: { id },
    });

    return { success: true, message: 'Expense deleted' };
  }

  async getStats(userId: string, tripId: string) {
    // Verify trip ownership
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, userId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const expenses = await this.prisma.expense.findMany({
      where: { tripId, userId },
    });

    // Calculate stats
    const totalKRW = expenses.reduce(
      (sum, e) => sum + Number(e.amountKRW),
      0,
    );

    const byCategory: Record<string, number> = {};
    const byDate: Record<string, number> = {};
    const byCurrency: Record<string, { amount: number; amountKRW: number }> = {};

    for (const expense of expenses) {
      // By category
      byCategory[expense.category] =
        (byCategory[expense.category] || 0) + Number(expense.amountKRW);

      // By date
      const dateKey = expense.expenseDate.toISOString().split('T')[0];
      byDate[dateKey] = (byDate[dateKey] || 0) + Number(expense.amountKRW);

      // By currency
      if (!byCurrency[expense.currency]) {
        byCurrency[expense.currency] = { amount: 0, amountKRW: 0 };
      }
      byCurrency[expense.currency].amount += Number(expense.amount);
      byCurrency[expense.currency].amountKRW += Number(expense.amountKRW);
    }

    // Find max day and category
    const maxDay = Object.entries(byDate).reduce(
      (max, [date, amount]) =>
        amount > (max?.amount || 0) ? { date, amount } : max,
      null as { date: string; amount: number } | null,
    );

    const maxCategory = Object.entries(byCategory).reduce(
      (max, [category, amount]) =>
        amount > (max?.amount || 0) ? { category, amount } : max,
      null as { category: string; amount: number } | null,
    );

    // Calculate average per day
    const days = Object.keys(byDate).length || 1;
    const avgPerDay = totalKRW / days;

    return {
      totalKRW,
      byCategory,
      byDate,
      byCurrency,
      avgPerDay,
      maxDay,
      maxCategory,
      expenseCount: expenses.length,
    };
  }
}
