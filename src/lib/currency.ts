import { MemberPaymentStatus } from './types';

/**
 * Converts a currency value into integer paise (cents) to avoid any floating-point arithmetic issues.
 */
export function toPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    const clean = rupees.replace(/[^0-9.-]+/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : Math.round(num * 100);
  }
  return isNaN(rupees) ? 0 : Math.round(rupees * 100);
}

/**
 * Converts integer paise back into rupees decimal.
 */
export function fromPaise(paise: number): number {
  return paise / 100;
}

/**
 * Adds two monetary amounts cleanly using integer paise arithmetic.
 */
export function addMoney(a: number, b: number): number {
  return fromPaise(toPaise(a) + toPaise(b));
}

/**
 * Subtracts two monetary amounts cleanly using integer paise arithmetic.
 */
export function subtractMoney(a: number, b: number): number {
  return fromPaise(toPaise(a) - toPaise(b));
}

/**
 * Multiplies money by quantity or factor cleanly.
 */
export function multiplyMoney(amount: number, factor: number): number {
  return fromPaise(Math.round(toPaise(amount) * factor));
}

/**
 * Formats a monetary number into Indian Rupee format.
 * Examples:
 *  formatINR(48000) -> "₹48,000"
 *  formatINR(525000) -> "₹5,25,000"
 *  formatINR(525000.5, true) -> "₹5,25,000.50"
 */
export function formatINR(amount: number | string | null | undefined, showDecimals: boolean = false): string {
  if (amount === null || amount === undefined) return '₹0';
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numeric)) return '₹0';

  const isNegative = numeric < 0;
  const absAmount = Math.abs(numeric);

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(absAmount);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Computes balance: Balance = Expected Amount - Paid Amount
 * Returns 0 if paid exceeds expected (overpayment is recorded in status).
 */
export function calculateBalance(expected: number, paid: number): number {
  const expectedPaise = toPaise(expected);
  const paidPaise = toPaise(paid);
  const diff = expectedPaise - paidPaise;
  return diff > 0 ? fromPaise(diff) : 0;
}

/**
 * Determines member payment status according to exact business rules:
 * - If paid amount >= expected amount: 'Paid'
 * - If paid amount > 0 but less than expected: 'Partial'
 * - If paid amount = 0: 'Pending'
 * - If paid amount > expected amount: 'Overpaid'
 */
export function getPaymentStatus(expected: number, paid: number): MemberPaymentStatus {
  const expectedPaise = toPaise(expected);
  const paidPaise = toPaise(paid);

  if (paidPaise === 0) {
    return 'Pending';
  }
  if (paidPaise > expectedPaise) {
    return 'Overpaid';
  }
  if (paidPaise >= expectedPaise) {
    return 'Paid';
  }
  return 'Partial';
}

/**
 * Status color utilities for UI consistency
 */
export function getStatusColor(status: MemberPaymentStatus | string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case 'Paid':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-500/20 dark:border-emerald-500/30',
        dot: 'bg-emerald-500',
      };
    case 'Partial':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-500/20 dark:border-amber-500/30',
        dot: 'bg-amber-500',
      };
    case 'Overpaid':
      return {
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-500/20 dark:border-blue-500/30',
        dot: 'bg-blue-500',
      };
    case 'Pending':
    default:
      return {
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-500/20 dark:border-rose-500/30',
        dot: 'bg-rose-500',
      };
  }
}
