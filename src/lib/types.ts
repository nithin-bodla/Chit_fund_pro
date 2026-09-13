export type ChitGroup = {
  id: string;
  name: string;
  total_members: number;
  monthly_base_amount: number;
  regular_member_monthly_amount: number;
  after_lift_monthly_amount: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
};

export type Member = {
  id: string;
  chit_group_id: string;
  member_number: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: 'active' | 'inactive';
  joined_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type MonthlyInstallment = {
  id: string;
  chit_group_id: string;
  month_number: number;
  month_name: string;
  due_date: string;
  expected_amount: number;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Other';
export type PaymentStatus = 'Completed' | 'Pending' | 'Failed';

export type Payment = {
  id: string;
  member_id: string;
  chit_group_id: string;
  installment_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_number: string;
  status: PaymentStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  member_name?: string;
  member_number?: number;
  month_name?: string;
  month_number?: number;
};

export type Auction = {
  id: string;
  chit_group_id: string;
  installment_id: string;
  auction_date: string;
  chit_value: number;
  winning_bid: number;
  discount: number;
  dividend_per_member: number;
  winner_member_id: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  winner_name?: string;
  winner_number?: number;
  month_name?: string;
  month_number?: number;
};

export type User = {
  id: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: string;
};

export type MemberPaymentStatus = 'Paid' | 'Partial' | 'Pending' | 'Overpaid';

export type MemberInstallmentStatus = {
  member_id: string;
  member_number: number;
  member_name: string;
  phone: string;
  expected_amount: number;
  paid_amount: number;
  balance: number;
  status: MemberPaymentStatus;
  last_payment_date: string | null;
  last_payment_method: string | null;
  payments: Payment[];
};

export type MonthCollectionSummary = {
  installment_id: string;
  month_number: number;
  month_name: string;
  due_date: string;
  expected_amount: number;
  collected_amount: number;
  pending_amount: number;
  collection_percentage: number;
  status: 'Completed' | 'In Progress' | 'Upcoming';
  auction?: Auction | null;
};

export type MemberOverview = {
  id: string;
  member_number: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: string;
  monthly_amount: number;
  total_expected: number;
  total_paid: number;
  total_pending: number;
  last_payment_date: string | null;
  status_badge: MemberPaymentStatus;
  has_won_auction: boolean;
  won_auction_month?: string;
};

export type DashboardMetrics = {
  chit_name: string;
  total_members: number;
  current_month_name: string;
  current_month_number: number;
  total_chit_value: number;
  expected_this_month: number;
  collected_this_month: number;
  pending_this_month: number;
  collection_percentage_this_month: number;
  total_expected_overall: number;
  total_collected_overall: number;
  total_outstanding_overall: number;
  member_statuses: MemberInstallmentStatus[];
  monthly_trends: {
    month_name: string;
    expected: number;
    collected: number;
  }[];
};
