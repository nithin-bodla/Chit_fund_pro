# ChitFund Pro 💰

A full-stack, production-ready web application designed for managing a **10-member chit fund business**. Architected and optimized specifically for **Vercel Hobby (Free plan)** serverless deployment paired with a **Neon PostgreSQL** cloud database.

---

## Key Features

- **Public View-Only Mode**: Public visitors can view real-time ledgers, reports, member records, and collection schedules without edit triggers.
- **Dedicated `/admin` Portal**: Secure login gate at `/admin` unlocking full administrative capabilities, inline collection, member editing, and parameter configuration.
- **Multi-Admin Management**: Support for multiple co-administrators with separate, independent usernames and secure credentials configured directly in Settings.
- **Dynamic Capacity & Member Scaling**: Adaptable chit fund architecture supporting dynamic member expansion, custom pool amounts, and variable installment schedules across all tables.
- **Editable Payment Records**: Full edit and adjustment capabilities for recorded payments, reference IDs, dates, and payment notes.
- **Dynamic Financial Dashboard**: Real-time calculations of Total Chit Value, Collected amounts, Deficits/Pending dues, and a monthly collection progress bar.
- **Monthly Collection Register**: Month-by-month progress overview with click-to-expand member payment breakdown and inline collection triggers.
- **Payments Ledger**: Filter by member, installment month, payment status, and payment method (Cash, UPI, Bank Transfer, Other).
- **Auction / Lift Tracking**: Records monthly bidding, winner payout, discount, and automatically tracks chit lift status.
- **5 Comprehensive Reports with CSV Export**:
  1. Monthly Collection Report
  2. Member Payment Report
  3. Outstanding Balances Report
  4. Total Collection Ledger
  5. Auction / Lift Report
  - One-click RFC-4180 CSV export generated without external paid services.
- **Security & Authentication**: HTTP-only secure cookie session, signed JWT tokens (`jose`), and salted bcrypt password hashing.

---

## Tech Stack

- **Framework**: Next.js (App Router, Server Actions)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: Neon PostgreSQL via `@neondatabase/serverless` (HTTP connection pool)
- **Hosting**: Vercel (Hobby / Free plan)

---

## Step-by-Step Vercel Hobby Deployment Guide

Follow these 10 steps to deploy this application to Vercel for free:

### 1. Create the Project Locally
Clone or open this repository on your local computer:
```bash
git clone <your-repo-url>
cd CHIT_Manager
npm install
```

### 2. Connect GitHub
Push your local code to a GitHub repository:
```bash
git init
git add .
git commit -m "Initial commit: ChitFund Pro"
git branch -M main
git remote add origin https://github.com/<your-username>/chit-fund-manager.git
git push -u origin main
```

### 3. Create Neon Database through Vercel Marketplace (or Neon.tech)
- Log into your [Vercel Dashboard](https://vercel.com).
- Navigate to **Storage** tab or **Integrations/Marketplace**.
- Search for **Neon** and click **Install / Connect**.
- Select the free tier (Hobby).
- Alternatively, sign up directly at [neon.tech](https://neon.tech) and create a free PostgreSQL database.

### 4. Add Environment Variables
In your Vercel Project Settings (under **Settings > Environment Variables**), add:

| Variable Name | Description | Example |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL pooled connection URI | `postgresql://user:pass@ep-xxxx.neon.tech/neondb?sslmode=require` |
| `AUTH_SECRET` | Secret key for JWT session encryption | `openssl rand -base64 32` or random 32+ characters |

### 5. Run Database Migrations
When you deploy, the application automatically runs the SQL schema migrations on startup if tables do not exist.
Alternatively, you can run the migration manually from your local terminal:
```bash
DATABASE_URL="your-neon-url" npm run db:seed
```
Or execute the SQL commands located in `db/schema.sql` inside the Neon SQL Console.

### 6. Seed Initial Chit Data
Initial seed data creates:
- The 10-month chit fund group
- 10 member slots ready to rename
- Configured monthly installments (September to June)
- Default values: ₹5,000 monthly, ₹6,000 after lift

You can trigger this at any time using the **Reset & Reseed Initial Data** button on the in-app **Settings** page or by running `npm run db:seed`.

### 7. Configure Admin Credentials
Configure your secure initial administrator credentials in your environment variables (`.env.local` or Vercel Project Settings):
```env
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-secure-admin-password"
```
You can also change your username and password or create additional co-administrators at any time directly from the **Settings > Admin Accounts & Credentials** interface.

### 8. Deploy to Vercel
In Vercel:
- Click **Import Project** and select your GitHub repository.
- Ensure the build command is `npm run build`.
- Click **Deploy**.

### 9. Open the Deployed URL
Once deployment completes (approx. 1 minute), click the generated domain (e.g., `https://your-chit-app.vercel.app`).

### 10. Login to the Admin Dashboard
- Navigate to `/admin`.
- Enter your configured admin credentials.
- You will be redirected to the administrative command center with full editing privileges.

---

## Local Development

1. Create a `.env.local` file:
```bash
cp .env.example .env.local
```
2. If you do not have a `DATABASE_URL` yet, the app will run with the included built-in local store so you can explore all features right away.
3. Start the development server:
```bash
npm run dev
```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.
