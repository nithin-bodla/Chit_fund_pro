import bcrypt from 'bcryptjs';
import { ChitGroup, Member, MonthlyInstallment, Payment, Auction, User } from './types';

export const INITIAL_CHIT_GROUP: Omit<ChitGroup, 'id' | 'created_at' | 'updated_at'> = {
  name: process.env.CHIT_FUND_NAME || 'Sri Lakshmi Chit Fund',
  total_members: 10,
  monthly_base_amount: 50000,
  regular_member_monthly_amount: 5000,
  after_lift_monthly_amount: 6000,
  start_date: '2026-09-01',
  end_date: '2027-06-30',
  status: 'active',
};

export const INITIAL_INSTALLMENTS = [
  { month_number: 1, month_name: 'September', due_date: '2026-09-10', expected_amount: 48000, notes: 'First month installment' },
  { month_number: 2, month_name: 'October', due_date: '2026-10-10', expected_amount: 49000, notes: 'Festive season month' },
  { month_number: 3, month_name: 'November', due_date: '2026-11-10', expected_amount: 50000, notes: 'Third installment' },
  { month_number: 4, month_name: 'December', due_date: '2026-12-10', expected_amount: 51000, notes: 'Year-end installment' },
  { month_number: 5, month_name: 'January', due_date: '2027-01-10', expected_amount: 52000, notes: 'New year installment' },
  { month_number: 6, month_name: 'February', due_date: '2027-02-10', expected_amount: 53000, notes: 'Sixth installment' },
  { month_number: 7, month_name: 'March', due_date: '2027-03-10', expected_amount: 54000, notes: 'Financial year end month' },
  { month_number: 8, month_name: 'April', due_date: '2027-04-10', expected_amount: 55000, notes: 'Eighth installment' },
  { month_number: 9, month_name: 'May', due_date: '2027-05-10', expected_amount: 56000, notes: 'Ninth installment' },
  { month_number: 10, month_name: 'June', due_date: '2027-06-10', expected_amount: 57000, notes: 'Final settlement month' },
];

export const INITIAL_MEMBERS = [
  { member_number: 1, name: 'Ramesh Kumar', phone: '+91 98765 43210', email: 'ramesh.kumar@example.com', address: '#12, 4th Cross, Malleshwaram, Bangalore', notes: 'Founder member' },
  { member_number: 2, name: 'Suresh Patel', phone: '+91 98765 43211', email: 'suresh.patel@example.com', address: '#45, MG Road, Bangalore', notes: 'Shop owner' },
  { member_number: 3, name: 'Rajesh Sharma', phone: '+91 98765 43212', email: 'rajesh.sharma@example.com', address: '#88, 100ft Road, Indiranagar, Bangalore', notes: 'Prefers UPI payments' },
  { member_number: 4, name: 'Priya Sundaram', phone: '+91 98765 43213', email: 'priya.s@example.com', address: '#21, 5th Main, Jayanagar, Bangalore', notes: 'Month 1 auction winner' },
  { member_number: 5, name: 'Anita Desai', phone: '+91 98765 43214', email: 'anita.desai@example.com', address: '#102, 17th Cross, Sadashivnagar, Bangalore', notes: 'Timely payer' },
  { member_number: 6, name: 'Venkat Rao', phone: '+91 98765 43215', email: 'venkat.rao@example.com', address: '#56, ITPL Main Road, Whitefield, Bangalore', notes: 'Pending payment reminder sent' },
  { member_number: 7, name: 'Karthik Narayanan', phone: '+91 98765 43216', email: 'karthik.n@example.com', address: '#34, 80ft Road, Koramangala, Bangalore', notes: 'Bank transfer payer' },
  { member_number: 8, name: 'Lakshmi Reddy', phone: '+91 98765 43217', email: 'lakshmi.reddy@example.com', address: '#77, 27th Main, HSR Layout, Bangalore', notes: 'Cash payer' },
  { member_number: 9, name: 'Manoj Verma', phone: '+91 98765 43218', email: 'manoj.v@example.com', address: '#90, Outer Ring Road, BTM Layout, Bangalore', notes: 'Always pays on due date' },
  { member_number: 10, name: 'Deepa Nair', phone: '+91 98765 43219', email: 'deepa.nair@example.com', address: '#15, 1st Block, Rajajinagar, Bangalore', notes: 'Advance payer' },
];

export function getInitialAdminUsername(): string {
  return process.env.ADMIN_USERNAME || 'admin';
}

export async function getInitialAdminHash(): Promise<string> {
  const initialPassword = process.env.ADMIN_PASSWORD || 'ChitAdmin@2026';
  return bcrypt.hash(initialPassword, 10);
}
