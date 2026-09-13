import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'ChitFund Pro - Chit Fund Management System',
  description: 'Production-ready financial management system for small chit fund businesses with Neon PostgreSQL.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const isAdmin = session?.role === 'admin';

  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 dark:bg-slate-950">
        <AppShell username={session?.username} isAdmin={isAdmin}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
