import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.log('⚠️ DATABASE_URL is not set in environment. Exiting.');
  process.exit(0);
}

const sql = neon(dbUrl);

async function runSeed() {
  console.log('⚡ Connecting to Neon PostgreSQL and initializing schema...');

  // 1. Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS chit_groups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      total_members INTEGER NOT NULL DEFAULT 10,
      monthly_base_amount NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
      regular_member_monthly_amount NUMERIC(12, 2) NOT NULL DEFAULT 5000.00,
      after_lift_monthly_amount NUMERIC(12, 2) NOT NULL DEFAULT 6000.00,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chit_group_id UUID NOT NULL REFERENCES chit_groups(id) ON DELETE CASCADE,
      member_number INTEGER NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      email VARCHAR(255),
      address TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      joined_date DATE DEFAULT CURRENT_DATE,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_group_member_num UNIQUE(chit_group_id, member_number)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS monthly_installments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chit_group_id UUID NOT NULL REFERENCES chit_groups(id) ON DELETE CASCADE,
      month_number INTEGER NOT NULL,
      month_name VARCHAR(100) NOT NULL,
      due_date DATE NOT NULL,
      expected_amount NUMERIC(12, 2) NOT NULL,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_group_month_num UNIQUE(chit_group_id, month_number)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      chit_group_id UUID NOT NULL REFERENCES chit_groups(id) ON DELETE CASCADE,
      installment_id UUID NOT NULL REFERENCES monthly_installments(id) ON DELETE CASCADE,
      amount NUMERIC(12, 2) NOT NULL,
      payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
      payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
      reference_number VARCHAR(100),
      status VARCHAR(50) NOT NULL DEFAULT 'Completed',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS auctions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chit_group_id UUID NOT NULL REFERENCES chit_groups(id) ON DELETE CASCADE,
      installment_id UUID NOT NULL REFERENCES monthly_installments(id) ON DELETE CASCADE,
      auction_date DATE NOT NULL DEFAULT CURRENT_DATE,
      chit_value NUMERIC(12, 2) NOT NULL,
      winning_bid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      dividend_per_member NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      winner_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_group_installment_auction UNIQUE(chit_group_id, installment_id)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'admin',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  console.log('✓ Tables verified.');

  // Check if admin user exists
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChitAdmin@2026';
  const adminHash = await bcrypt.hash(adminPassword, 10);
  await sql`
    INSERT INTO users (username, password_hash, role)
    VALUES (${adminUsername}, ${adminHash}, 'admin')
    ON CONFLICT (username) DO NOTHING;
  `;
  console.log(`✓ Admin user verified (@${adminUsername}).`);

  console.log('🎉 Database initialization complete!');
}

runSeed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
