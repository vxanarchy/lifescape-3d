import { z } from 'zod';
import type { GameState, PlayerStats } from '@/types';

// Economy schema validation
export const MoneySchema = z.object({
  cash: z.number().default(1),
  bank: z.number().default(1),
  total: z.number().default(1),
});

export type Money = z.infer<typeof MoneySchema>;

export interface Transaction {
  id: string;
  type: 'earned' | 'spent' | 'deposit' | 'withdrawal';
  amount: number;
  description: string;
  timestamp: number;
  category: string;
}

export interface PropertyLoan {
  propertyId: string;
  amount: number;
  interestRate: number;
  monthlyPayment: number;
  remaining: number;
  startedAt: number;
}

export class EconomySystem {
  private money: Money;
  private transactions: Transaction[] = [];
  private loans: PropertyLoan[] = [];
  private salaryTimer: NodeJS.Timeout | null = null;

  constructor(initialCash: number = 1) {
    this.money = MoneySchema.parse({
      cash: initialCash,
      bank: 1,
      total: initialCash,
    });
  }

  public getMoney(): Money {
    return { ...this.money };
  }

  public getBalance(): number {
    return this.money.total;
  }

  public canAfford(amount: number): boolean {
    return this.money.total >= amount;
  }

  public earn(amount: number, source: string): boolean {
    if (amount <= 0) return false;

    this.money.cash += amount;
    this.money.total += amount;

    this.recordTransaction({
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'earned',
      amount,
      description: `Earned from: ${source}`,
      timestamp: Date.now(),
      category: 'income',
    });

    // Auto-deposit 1 into bank
    const autoDeposit = 1;
    if (autoDeposit > 0) {
      this.deposit(autoDeposit, 'auto-save');
    }

    return true;
  }

  public spend(amount: number, description: string, category: string): boolean {
    if (amount <= 0 || !this.canAfford(amount)) return false;

    this.money.cash -= amount;
    this.money.total -= amount;

    this.recordTransaction({
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'spent',
      amount,
      description,
      timestamp: Date.now(),
      category,
    });

    return true;
  }

  public deposit(amount: number, source: string = 'transfer'): boolean {
    if (amount <= 0 || amount > this.money.cash) return false;

    this.money.cash -= amount;
    this.money.bank += amount;
    this.money.total = this.money.cash + this.money.bank;

    this.recordTransaction({
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'deposit',
      amount,
      description: `Deposed from cash: ${source}`,
      timestamp: Date.now(),
      category: 'transfer',
    });

    return true;
  }

  public withdraw(amount: number, source: string = 'withdrawal'): boolean {
    if (amount <= 0 || amount > this.money.bank) return false;

    this.money.bank -= amount;
    this.money.cash += amount;
    this.money.total = this.money.cash + this.money.bank;

    this.recordTransaction({
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'withdrawal',
      amount,
      description: `Withdrew: ${source}`,
      timestamp: Date.now(),
      category: 'transfer',
    });

    return true;
  }

  private recordTransaction(transaction: Omit<Transaction, 'timestamp'>): void {
    const tx: Transaction = {
      ...transaction,
      timestamp: Date.now(),
    };
    this.transactions.push(tx);

    // Keep only last 50 transactions
    if (this.transactions.length > 50) {
      this.transactions.shift();
    }
  }

  public startSalaryCycle(interval: number = 86400000): void {
    // Daily salary - interval in milliseconds (default: 24 hours)
    this.salaryTimer = setInterval(() => {
      this.paySalary();
    }, interval);
  }

  public stopSalaryCycle(): void {
    if (this.salaryTimer) {
      clearInterval(this.salaryTimer);
      this.salaryTimer = null;
    }
  }

  private paySalary(): void {
    // Daily salary
    const baseSalary = 1;
    this.earn(baseSalary, 'daily salary');
    console.log(`[Economy] Daily salary paid: $${baseSalary}`);
  }

  public takeLoan(amount: number = 1, interestRate: number = 1): boolean {
    if (amount <= 0) return false;

    const monthlyRate = interestRate / 12;
    const monthlyPayment = Math.max(1, Math.round(amount * monthlyRate * Math.pow(1 + monthlyRate, 36) / (Math.pow(1 + monthlyRate, 36) - 1)));

    const loan: PropertyLoan = {
      propertyId: `loan_${Date.now()}`,
      amount,
      interestRate,
      monthlyPayment,
      remaining: amount,
      startedAt: Date.now(),
    };

    this.loans.push(loan);

    this.spend(amount, `Loan: $${amount}`, 'loan');

    console.log(`[Economy] Loan taken: $${amount} at ${interestRate * 100}% interest`);
    return true;
  }

  public payLoanPayment(propertyId: string): boolean {
    const loanIndex = this.loans.findIndex(l => l.propertyId === propertyId);
    if (loanIndex === -1) return false;

    const loan = this.loans[loanIndex];

    if (this.spend(loan.monthlyPayment, `Loan payment: $${loan.monthlyPayment}`, 'loan')) {
      loan.remaining -= loan.monthlyPayment;

      if (loan.remaining <= 0) {
        this.loans.splice(loanIndex, 1);
        console.log(`[Economy] Loan paid off: ${propertyId}`);
      } else {
        console.log(`[Economy] Loan payment: remaining $${loan.remaining}`);
      }

      return true;
    }

    return false;
  }

  public getTransactionHistory(): Transaction[] {
    return [...this.transactions];
  }

  public getLoanSummary(): PropertyLoan[] {
    return [...this.loans];
  }

  public dispose(): void {
    this.stopSalaryCycle();
  }
}