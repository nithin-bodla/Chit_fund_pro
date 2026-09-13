'use server';

import {
  getChitGroup,
  getMembers,
  getInstallments,
  getPayments,
  getAuctions,
  getMemberExpectedAmountForMonth,
} from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { calculateBalance, getPaymentStatus, formatINR } from '@/lib/currency';

export async function getReportsDataAction(filters?: {
  startDate?: string;
  endDate?: string;
  monthId?: string;
  memberId?: string;
}) {
  const [group, members, installments, allPayments, auctions] = await Promise.all([
    getChitGroup(),
    getMembers(),
    getInstallments(),
    getPayments(),
    getAuctions(),
  ]);

  // Apply filters to payments
  let filteredPayments = [...allPayments];
  if (filters?.startDate) {
    filteredPayments = filteredPayments.filter((p) => p.payment_date >= filters.startDate!);
  }
  if (filters?.endDate) {
    filteredPayments = filteredPayments.filter((p) => p.payment_date <= filters.endDate!);
  }
  if (filters?.monthId && filters.monthId !== 'all') {
    filteredPayments = filteredPayments.filter((p) => p.installment_id === filters.monthId);
  }
  if (filters?.memberId && filters.memberId !== 'all') {
    filteredPayments = filteredPayments.filter((p) => p.member_id === filters.memberId);
  }

  // 1. Monthly Collection Report
  const monthlyCollectionReport = installments.map((inst) => {
    const instPayments = allPayments.filter((p) => p.installment_id === inst.id);
    const collected = instPayments.reduce((acc, p) => acc + p.amount, 0);
    const pending = Math.max(0, inst.expected_amount - collected);
    const pct = inst.expected_amount > 0 ? Math.round((collected / inst.expected_amount) * 100) : 0;
    const auction = auctions.find((a) => a.installment_id === inst.id);

    return {
      month_number: inst.month_number,
      month_name: inst.month_name,
      due_date: inst.due_date,
      expected_amount: inst.expected_amount,
      collected_amount: collected,
      pending_amount: pending,
      collection_percentage: pct,
      winner_name: auction?.winner_name || 'Not Held',
      winning_bid: auction?.winning_bid || 0,
      dividend: auction?.dividend_per_member || 0,
    };
  });

  // 2. Member Payment Report (All members across all months)
  const memberPaymentReport = members.map((m) => {
    const mPayments = allPayments.filter((p) => p.member_id === m.id);
    const totalPaid = mPayments.reduce((acc, p) => acc + p.amount, 0);

    let totalExpected = 0;
    for (const inst of installments) {
      totalExpected += getMemberExpectedAmountForMonth(m.id, inst, group, auctions);
    }
    const pending = Math.max(0, totalExpected - totalPaid);

    return {
      member_number: m.member_number,
      name: m.name,
      phone: m.phone,
      total_expected: totalExpected,
      total_paid: totalPaid,
      total_pending: pending,
      payment_count: mPayments.length,
      status: getPaymentStatus(totalExpected, totalPaid),
    };
  });

  // 3. Outstanding Balances Report (filtered to members with pending balance)
  const outstandingReport = memberPaymentReport
    .filter((m) => m.total_pending > 0)
    .sort((a, b) => b.total_pending - a.total_pending);

  // 4. Detailed Payment Ledger Report (using filtered payments)
  const paymentLedgerReport = filteredPayments.map((p) => ({
    payment_id: p.id,
    date: p.payment_date,
    member_number: p.member_number,
    member_name: p.member_name,
    month: p.month_name,
    amount: p.amount,
    method: p.payment_method,
    reference: p.reference_number,
    status: p.status,
    notes: p.notes,
  }));

  // 5. Auction / Lift Report
  const auctionReport = auctions.map((a) => ({
    month: a.month_name,
    date: a.auction_date,
    chit_value: a.chit_value,
    winner: a.winner_name || 'N/A',
    winning_bid: a.winning_bid,
    discount: a.discount,
    winner_received: a.chit_value - a.winning_bid,
    dividend_per_member: a.dividend_per_member,
    notes: a.notes,
  }));

  return {
    group,
    monthlyCollectionReport,
    memberPaymentReport,
    outstandingReport,
    paymentLedgerReport,
    auctionReport,
    members,
    installments,
  };
}
