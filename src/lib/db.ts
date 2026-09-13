import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import {
  ChitGroup,
  Member,
  MonthlyInstallment,
  Payment,
  Auction,
  User,
  MemberPaymentStatus,
  MemberInstallmentStatus,
  MonthCollectionSummary,
  DashboardMetrics,
  MemberOverview,
} from './types';
import {
  INITIAL_CHIT_GROUP,
  INITIAL_INSTALLMENTS,
  INITIAL_MEMBERS,
  getInitialAdminUsername,
  getInitialAdminHash,
} from './seed';
import { calculateBalance, getPaymentStatus, toPaise, fromPaise } from './currency';

export function getDbUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED
  );
}

let sqlClient: NeonQueryFunction<false, false> | null = null;

export function getSqlClient(): NeonQueryFunction<false, false> | null {
  const dbUrl = getDbUrl();
  if (!dbUrl) return null;
  if (!sqlClient) {
    sqlClient = neon(dbUrl);
  }
  return sqlClient;
}

export function isNeonConfigured(): boolean {
  const dbUrl = getDbUrl();
  return Boolean(dbUrl && dbUrl.trim().length > 0);
}

// -------------------------------------------------------------
// In-Memory / Local fallback store
// -------------------------------------------------------------
class LocalStore {
  chitGroups: ChitGroup[] = [];
  members: Member[] = [];
  installments: MonthlyInstallment[] = [];
  payments: Payment[] = [];
  auctions: Auction[] = [];
  users: User[] = [];
  initialized = false;

  async init() {
    if (this.initialized) return;

    const groupId = 'group-10-members-default';
    const now = new Date().toISOString();

    this.chitGroups = [
      {
        id: groupId,
        ...INITIAL_CHIT_GROUP,
        created_at: now,
        updated_at: now,
      },
    ];

    this.installments = INITIAL_INSTALLMENTS.map((inst, index) => ({
      id: `inst-${index + 1}`,
      chit_group_id: groupId,
      ...inst,
      created_at: now,
      updated_at: now,
    }));

    this.members = [];

    const adminUsername = getInitialAdminUsername();
    const adminHash = await getInitialAdminHash();
    this.users = [
      {
        id: 'user-admin-1',
        username: adminUsername,
        password_hash: adminHash,
        role: 'admin',
        created_at: now,
      },
    ];

    this.payments = [];
    this.auctions = [];

    this.initialized = true;
  }

  clearAllData() {
    this.members = [];
    this.payments = [];
    this.auctions = [];
    const adminUsername = getInitialAdminUsername();
    this.users = this.users.filter((u) => u.username === adminUsername);
  }
}

// Global singleton local store for serverless node instance
declare global {
  // eslint-disable-next-line no-var
  var __localStore: LocalStore | undefined;
}

const localStore = global.__localStore || new LocalStore();
if (process.env.NODE_ENV !== 'production') {
  global.__localStore = localStore;
}

// -------------------------------------------------------------
// Database Initialization & Schema Migration (Neon)
// -------------------------------------------------------------
export async function ensureDatabaseInitialized(): Promise<void> {
  const sql = getSqlClient();
  if (!sql) {
    await localStore.init();
    return;
  }

  // Neon DB schema initialization
  try {
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

    // Check if chit_groups has any record, if not seed it automatically
    const existingGroups = await sql`SELECT id FROM chit_groups LIMIT 1`;
    if (existingGroups.length === 0) {
      await seedNeonDatabase();
    }
  } catch (err) {
    console.error('Neon DB schema check/init error:', err);
  }
}

export async function seedNeonDatabase(): Promise<void> {
  const sql = getSqlClient();
  if (!sql) {
    localStore.initialized = false;
    await localStore.init();
    return;
  }

  // 1. Insert chit group
  const groupRows = await sql`
    INSERT INTO chit_groups (
      name, total_members, monthly_base_amount, regular_member_monthly_amount,
      after_lift_monthly_amount, start_date, end_date, status
    ) VALUES (
      ${INITIAL_CHIT_GROUP.name},
      ${INITIAL_CHIT_GROUP.total_members},
      ${INITIAL_CHIT_GROUP.monthly_base_amount},
      ${INITIAL_CHIT_GROUP.regular_member_monthly_amount},
      ${INITIAL_CHIT_GROUP.after_lift_monthly_amount},
      ${INITIAL_CHIT_GROUP.start_date},
      ${INITIAL_CHIT_GROUP.end_date},
      ${INITIAL_CHIT_GROUP.status}
    ) RETURNING id;
  `;
  const groupId = groupRows[0].id;

  // 2. Insert installments
  const installmentMap: Record<number, string> = {};
  for (const inst of INITIAL_INSTALLMENTS) {
    const instRows = await sql`
      INSERT INTO monthly_installments (
        chit_group_id, month_number, month_name, due_date, expected_amount, notes
      ) VALUES (
        ${groupId}, ${inst.month_number}, ${inst.month_name}, ${inst.due_date}, ${inst.expected_amount}, ${inst.notes}
      ) RETURNING id, month_number;
    `;
    installmentMap[inst.month_number] = instRows[0].id;
  }

  // 3. Insert members
  // 3. Insert admin user
  const adminUsername = getInitialAdminUsername();
  const adminHash = await getInitialAdminHash();
  await sql`
    INSERT INTO users (username, password_hash, role)
    VALUES (${adminUsername}, ${adminHash}, 'admin')
    ON CONFLICT (username) DO NOTHING;
  `;
}

// -------------------------------------------------------------
// Clear All Business Data (Clean Slate)
// -------------------------------------------------------------
export async function clearAllBusinessData(): Promise<void> {
  const sql = getSqlClient();
  if (!sql) {
    localStore.clearAllData();
    return;
  }

  await sql`DELETE FROM payments;`;
  await sql`DELETE FROM auctions;`;
  await sql`DELETE FROM members;`;
  const adminUsername = getInitialAdminUsername();
  await sql`DELETE FROM users WHERE username != ${adminUsername};`;
}

// -------------------------------------------------------------
// Database Operations (Neon & Local Fallback)
// -------------------------------------------------------------

export async function getChitGroup(): Promise<ChitGroup> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    const rows = await sql`SELECT * FROM chit_groups ORDER BY created_at ASC LIMIT 1;`;
    if (rows.length > 0) {
      const r = rows[0];
      return {
        id: r.id,
        name: r.name,
        total_members: Number(r.total_members),
        monthly_base_amount: Number(r.monthly_base_amount),
        regular_member_monthly_amount: Number(r.regular_member_monthly_amount || 5000),
        after_lift_monthly_amount: Number(r.after_lift_monthly_amount || 6000),
        start_date: String(r.start_date).slice(0, 10),
        end_date: String(r.end_date).slice(0, 10),
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    }
  }

  await localStore.init();
  return localStore.chitGroups[0];
}

export async function updateChitGroup(data: Partial<ChitGroup>): Promise<ChitGroup> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    const current = await getChitGroup();
    const updated = { ...current, ...data, updated_at: new Date().toISOString() };
    await sql`
      UPDATE chit_groups
      SET
        name = ${updated.name},
        total_members = ${updated.total_members},
        monthly_base_amount = ${updated.monthly_base_amount},
        regular_member_monthly_amount = ${updated.regular_member_monthly_amount},
        after_lift_monthly_amount = ${updated.after_lift_monthly_amount},
        start_date = ${updated.start_date},
        end_date = ${updated.end_date},
        status = ${updated.status},
        updated_at = NOW()
      WHERE id = ${current.id};
    `;
    return updated;
  }

  await localStore.init();
  const g = localStore.chitGroups[0];
  Object.assign(g, data, { updated_at: new Date().toISOString() });
  return g;
}

export async function getMembers(): Promise<Member[]> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    const rows = await sql`SELECT * FROM members ORDER BY member_number ASC;`;
    return rows.map((r) => ({
      id: r.id,
      chit_group_id: r.chit_group_id,
      member_number: Number(r.member_number),
      name: r.name,
      phone: r.phone || '',
      email: r.email || '',
      address: r.address || '',
      status: r.status,
      joined_date: String(r.joined_date).slice(0, 10),
      notes: r.notes || '',
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  await localStore.init();
  return [...localStore.members].sort((a, b) => a.member_number - b.member_number);
}

export async function getMemberById(id: string): Promise<Member | null> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    const rows = await sql`SELECT * FROM members WHERE id = ${id} LIMIT 1;`;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      chit_group_id: r.chit_group_id,
      member_number: Number(r.member_number),
      name: r.name,
      phone: r.phone || '',
      email: r.email || '',
      address: r.address || '',
      status: r.status,
      joined_date: String(r.joined_date).slice(0, 10),
      notes: r.notes || '',
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }

  await localStore.init();
  return localStore.members.find((m) => m.id === id) || null;
}

export async function createMember(data: Omit<Member, 'id' | 'created_at' | 'updated_at'>): Promise<Member> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();
  const now = new Date().toISOString();

  if (sql) {
    const rows = await sql`
      INSERT INTO members (
        chit_group_id, member_number, name, phone, email, address, status, joined_date, notes
      ) VALUES (
        ${data.chit_group_id}, ${data.member_number}, ${data.name}, ${data.phone},
        ${data.email}, ${data.address}, ${data.status}, ${data.joined_date}, ${data.notes}
      ) RETURNING *;
    `;
    const r = rows[0];
    return {
      id: r.id,
      chit_group_id: r.chit_group_id,
      member_number: Number(r.member_number),
      name: r.name,
      phone: r.phone || '',
      email: r.email || '',
      address: r.address || '',
      status: r.status,
      joined_date: String(r.joined_date).slice(0, 10),
      notes: r.notes || '',
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }

  await localStore.init();
  const newMember: Member = {
    id: `member-${Date.now()}`,
    ...data,
    created_at: now,
    updated_at: now,
  };
  localStore.members.push(newMember);
  return newMember;
}

export async function updateMember(id: string, data: Partial<Member>): Promise<Member | null> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    const current = await getMemberById(id);
    if (!current) return null;
    const updated = { ...current, ...data };
    await sql`
      UPDATE members
      SET
        member_number = ${updated.member_number},
        name = ${updated.name},
        phone = ${updated.phone},
        email = ${updated.email},
        address = ${updated.address},
        status = ${updated.status},
        joined_date = ${updated.joined_date},
        notes = ${updated.notes},
        updated_at = NOW()
      WHERE id = ${id};
    `;
    return updated;
  }

  await localStore.init();
  const idx = localStore.members.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  localStore.members[idx] = { ...localStore.members[idx], ...data, updated_at: new Date().toISOString() };
  return localStore.members[idx];
}

export async function deleteMember(id: string): Promise<boolean> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    await sql`DELETE FROM members WHERE id = ${id};`;
    return true;
  }

  await localStore.init();
  const initialLength = localStore.members.length;
  localStore.members = localStore.members.filter((m) => m.id !== id);
  localStore.payments = localStore.payments.filter((p) => p.member_id !== id);
  return localStore.members.length < initialLength;
}

export async function getInstallments(): Promise<MonthlyInstallment[]> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    const rows = await sql`SELECT * FROM monthly_installments ORDER BY month_number ASC;`;
    return rows.map((r) => ({
      id: r.id,
      chit_group_id: r.chit_group_id,
      month_number: Number(r.month_number),
      month_name: r.month_name,
      due_date: String(r.due_date).slice(0, 10),
      expected_amount: Number(r.expected_amount),
      notes: r.notes || '',
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  await localStore.init();
  return [...localStore.installments].sort((a, b) => a.month_number - b.month_number);
}

export async function updateInstallment(
  id: string,
  data: Partial<MonthlyInstallment>
): Promise<MonthlyInstallment | null> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    const rows = await sql`SELECT * FROM monthly_installments WHERE id = ${id};`;
    if (rows.length === 0) return null;
    const current = rows[0];
    const updated = {
      expected_amount: data.expected_amount !== undefined ? data.expected_amount : Number(current.expected_amount),
      due_date: data.due_date || current.due_date,
      month_name: data.month_name || current.month_name,
      notes: data.notes !== undefined ? data.notes : current.notes,
    };
    await sql`
      UPDATE monthly_installments
      SET
        expected_amount = ${updated.expected_amount},
        due_date = ${updated.due_date},
        month_name = ${updated.month_name},
        notes = ${updated.notes},
        updated_at = NOW()
      WHERE id = ${id};
    `;
    return {
      id: current.id,
      chit_group_id: current.chit_group_id,
      month_number: Number(current.month_number),
      month_name: updated.month_name,
      due_date: String(updated.due_date).slice(0, 10),
      expected_amount: updated.expected_amount,
      notes: updated.notes || '',
      created_at: current.created_at,
      updated_at: new Date().toISOString(),
    };
  }

  await localStore.init();
  const idx = localStore.installments.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  localStore.installments[idx] = {
    ...localStore.installments[idx],
    ...data,
    updated_at: new Date().toISOString(),
  };
  return localStore.installments[idx];
}

export async function createInstallment(
  data: Omit<MonthlyInstallment, 'id' | 'created_at' | 'updated_at'>
): Promise<MonthlyInstallment> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();
  const now = new Date().toISOString();

  if (sql) {
    const rows = await sql`
      INSERT INTO monthly_installments (
        chit_group_id, month_number, month_name, due_date, expected_amount, notes
      ) VALUES (
        ${data.chit_group_id}, ${data.month_number}, ${data.month_name}, ${data.due_date}, ${data.expected_amount}, ${data.notes || null}
      ) RETURNING *;
    `;
    const r = rows[0];
    return {
      id: r.id,
      chit_group_id: r.chit_group_id,
      month_number: Number(r.month_number),
      month_name: r.month_name,
      due_date: String(r.due_date).slice(0, 10),
      expected_amount: Number(r.expected_amount),
      notes: r.notes || '',
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }

  await localStore.init();
  const newInst: MonthlyInstallment = {
    id: `inst-${Date.now()}`,
    ...data,
    created_at: now,
    updated_at: now,
  };
  localStore.installments.push(newInst);
  return newInst;
}

export async function deleteInstallment(id: string): Promise<boolean> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    await sql`DELETE FROM monthly_installments WHERE id = ${id};`;
    return true;
  }

  await localStore.init();
  const len = localStore.installments.length;
  localStore.installments = localStore.installments.filter((i) => i.id !== id);
  return localStore.installments.length < len;
}

export async function getPayments(filters?: {
  member_id?: string;
  installment_id?: string;
  payment_method?: string;
  status?: string;
  search?: string;
}): Promise<Payment[]> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    let query = `
      SELECT
        p.*,
        m.name as member_name,
        m.member_number,
        i.month_name,
        i.month_number
      FROM payments p
      JOIN members m ON p.member_id = m.id
      JOIN monthly_installments i ON p.installment_id = i.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let pIdx = 1;

    if (filters?.member_id) {
      query += ` AND p.member_id = $${pIdx++}`;
      params.push(filters.member_id);
    }
    if (filters?.installment_id) {
      query += ` AND p.installment_id = $${pIdx++}`;
      params.push(filters.installment_id);
    }
    if (filters?.payment_method && filters.payment_method !== 'all') {
      query += ` AND p.payment_method = $${pIdx++}`;
      params.push(filters.payment_method);
    }
    if (filters?.status && filters.status !== 'all') {
      query += ` AND p.status = $${pIdx++}`;
      params.push(filters.status);
    }
    if (filters?.search) {
      query += ` AND (m.name ILIKE $${pIdx} OR p.reference_number ILIKE $${pIdx} OR p.notes ILIKE $${pIdx})`;
      params.push(`%${filters.search}%`);
      pIdx++;
    }

    query += ` ORDER BY p.payment_date DESC, p.created_at DESC;`;

    // Execute with neon parameterized query
    const rows = await (sql as any)(query, params);
    return rows.map((r: any) => ({
      id: r.id,
      member_id: r.member_id,
      chit_group_id: r.chit_group_id,
      installment_id: r.installment_id,
      amount: Number(r.amount),
      payment_date: String(r.payment_date).slice(0, 10),
      payment_method: r.payment_method,
      reference_number: r.reference_number || '',
      status: r.status,
      notes: r.notes || '',
      created_at: r.created_at,
      updated_at: r.updated_at,
      member_name: r.member_name,
      member_number: Number(r.member_number),
      month_name: r.month_name,
      month_number: Number(r.month_number),
    }));
  }

  await localStore.init();
  let list = localStore.payments.map((p) => {
    const member = localStore.members.find((m) => m.id === p.member_id);
    const inst = localStore.installments.find((i) => i.id === p.installment_id);
    return {
      ...p,
      member_name: member?.name,
      member_number: member?.member_number,
      month_name: inst?.month_name,
      month_number: inst?.month_number,
    };
  });

  if (filters?.member_id) {
    list = list.filter((p) => p.member_id === filters.member_id);
  }
  if (filters?.installment_id) {
    list = list.filter((p) => p.installment_id === filters.installment_id);
  }
  if (filters?.payment_method && filters.payment_method !== 'all') {
    list = list.filter((p) => p.payment_method === filters.payment_method);
  }
  if (filters?.status && filters.status !== 'all') {
    list = list.filter((p) => p.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.member_name?.toLowerCase().includes(q) ||
        p.reference_number?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q)
    );
  }

  return list.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
}

export async function createPayment(data: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<Payment> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();
  const now = new Date().toISOString();

  if (sql) {
    const rows = await sql`
      INSERT INTO payments (
        member_id, chit_group_id, installment_id, amount, payment_date, payment_method, reference_number, status, notes
      ) VALUES (
        ${data.member_id}, ${data.chit_group_id}, ${data.installment_id}, ${data.amount},
        ${data.payment_date}, ${data.payment_method}, ${data.reference_number || null},
        ${data.status || 'Completed'}, ${data.notes || null}
      ) RETURNING *;
    `;
    const r = rows[0];
    return {
      id: r.id,
      member_id: r.member_id,
      chit_group_id: r.chit_group_id,
      installment_id: r.installment_id,
      amount: Number(r.amount),
      payment_date: String(r.payment_date).slice(0, 10),
      payment_method: r.payment_method,
      reference_number: r.reference_number || '',
      status: r.status,
      notes: r.notes || '',
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }

  await localStore.init();
  const newPay: Payment = {
    id: `pay-${Date.now()}`,
    ...data,
    created_at: now,
    updated_at: now,
  };
  localStore.payments.push(newPay);
  return newPay;
}

export async function updatePayment(id: string, data: Partial<Payment>): Promise<Payment | null> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    const rows = await sql`SELECT * FROM payments WHERE id = ${id};`;
    if (rows.length === 0) return null;
    const current = rows[0];
    const updated = {
      member_id: data.member_id || current.member_id,
      installment_id: data.installment_id || current.installment_id,
      amount: data.amount !== undefined ? data.amount : Number(current.amount),
      payment_date: data.payment_date || current.payment_date,
      payment_method: data.payment_method || current.payment_method,
      reference_number: data.reference_number !== undefined ? data.reference_number : current.reference_number,
      status: data.status || current.status,
      notes: data.notes !== undefined ? data.notes : current.notes,
    };

    await sql`
      UPDATE payments
      SET
        member_id = ${updated.member_id},
        installment_id = ${updated.installment_id},
        amount = ${updated.amount},
        payment_date = ${updated.payment_date},
        payment_method = ${updated.payment_method},
        reference_number = ${updated.reference_number},
        status = ${updated.status},
        notes = ${updated.notes},
        updated_at = NOW()
      WHERE id = ${id};
    `;
    return {
      id: current.id,
      member_id: updated.member_id,
      chit_group_id: current.chit_group_id,
      installment_id: updated.installment_id,
      amount: updated.amount,
      payment_date: String(updated.payment_date).slice(0, 10),
      payment_method: updated.payment_method,
      reference_number: updated.reference_number || '',
      status: updated.status,
      notes: updated.notes || '',
      created_at: current.created_at,
      updated_at: new Date().toISOString(),
    };
  }

  await localStore.init();
  const idx = localStore.payments.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  localStore.payments[idx] = {
    ...localStore.payments[idx],
    ...data,
    updated_at: new Date().toISOString(),
  };
  return localStore.payments[idx];
}

export async function deletePayment(id: string): Promise<boolean> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    await sql`DELETE FROM payments WHERE id = ${id};`;
    return true;
  }

  await localStore.init();
  const len = localStore.payments.length;
  localStore.payments = localStore.payments.filter((p) => p.id !== id);
  return localStore.payments.length < len;
}

export async function getAuctions(): Promise<Auction[]> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    const rows = await sql`
      SELECT
        a.*,
        m.name as winner_name,
        m.member_number as winner_number,
        i.month_name,
        i.month_number
      FROM auctions a
      LEFT JOIN members m ON a.winner_member_id = m.id
      JOIN monthly_installments i ON a.installment_id = i.id
      ORDER BY i.month_number ASC;
    `;
    return rows.map((r) => ({
      id: r.id,
      chit_group_id: r.chit_group_id,
      installment_id: r.installment_id,
      auction_date: String(r.auction_date).slice(0, 10),
      chit_value: Number(r.chit_value),
      winning_bid: Number(r.winning_bid),
      discount: Number(r.discount),
      dividend_per_member: Number(r.dividend_per_member),
      winner_member_id: r.winner_member_id,
      notes: r.notes || '',
      created_at: r.created_at,
      updated_at: r.updated_at,
      winner_name: r.winner_name,
      winner_number: r.winner_number ? Number(r.winner_number) : undefined,
      month_name: r.month_name,
      month_number: Number(r.month_number),
    }));
  }

  await localStore.init();
  return localStore.auctions.map((a) => {
    const member = localStore.members.find((m) => m.id === a.winner_member_id);
    const inst = localStore.installments.find((i) => i.id === a.installment_id);
    return {
      ...a,
      winner_name: member?.name,
      winner_number: member?.member_number,
      month_name: inst?.month_name,
      month_number: inst?.month_number,
    };
  });
}

export async function createOrUpdateAuction(
  data: Omit<Auction, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<Auction> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();
  const now = new Date().toISOString();

  if (sql) {
    const rows = await sql`
      INSERT INTO auctions (
        chit_group_id, installment_id, auction_date, chit_value, winning_bid, discount, dividend_per_member, winner_member_id, notes
      ) VALUES (
        ${data.chit_group_id}, ${data.installment_id}, ${data.auction_date}, ${data.chit_value},
        ${data.winning_bid}, ${data.discount}, ${data.dividend_per_member}, ${data.winner_member_id}, ${data.notes}
      )
      ON CONFLICT (chit_group_id, installment_id)
      DO UPDATE SET
        auction_date = EXCLUDED.auction_date,
        chit_value = EXCLUDED.chit_value,
        winning_bid = EXCLUDED.winning_bid,
        discount = EXCLUDED.discount,
        dividend_per_member = EXCLUDED.dividend_per_member,
        winner_member_id = EXCLUDED.winner_member_id,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *;
    `;
    const r = rows[0];
    return {
      id: r.id,
      chit_group_id: r.chit_group_id,
      installment_id: r.installment_id,
      auction_date: String(r.auction_date).slice(0, 10),
      chit_value: Number(r.chit_value),
      winning_bid: Number(r.winning_bid),
      discount: Number(r.discount),
      dividend_per_member: Number(r.dividend_per_member),
      winner_member_id: r.winner_member_id,
      notes: r.notes || '',
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }

  await localStore.init();
  const existingIdx = localStore.auctions.findIndex((a) => a.installment_id === data.installment_id);
  if (existingIdx >= 0) {
    localStore.auctions[existingIdx] = {
      ...localStore.auctions[existingIdx],
      ...data,
      updated_at: now,
    };
    return localStore.auctions[existingIdx];
  }

  const newAuction: Auction = {
    id: `auction-${Date.now()}`,
    ...data,
    created_at: now,
    updated_at: now,
  };
  localStore.auctions.push(newAuction);
  return newAuction;
}

export async function deleteAuction(id: string): Promise<boolean> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    await sql`DELETE FROM auctions WHERE id = ${id};`;
    return true;
  }

  await localStore.init();
  const len = localStore.auctions.length;
  localStore.auctions = localStore.auctions.filter((a) => a.id !== id);
  return localStore.auctions.length < len;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    const rows = await sql`SELECT * FROM users WHERE username = ${username} LIMIT 1;`;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      username: r.username,
      password_hash: r.password_hash,
      role: r.role,
      created_at: r.created_at,
    };
  }

  await localStore.init();
  return localStore.users.find((u) => u.username === username) || null;
}

export async function getUserById(id: string): Promise<User | null> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1;`;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      username: r.username,
      password_hash: r.password_hash,
      role: r.role,
      created_at: r.created_at,
    };
  }

  await localStore.init();
  return localStore.users.find((u) => u.id === id) || null;
}

export async function getAllUsers(): Promise<User[]> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    const rows = await sql`SELECT id, username, role, created_at FROM users ORDER BY created_at ASC;`;
    return rows.map((r) => ({
      id: r.id,
      username: r.username,
      password_hash: '',
      role: r.role,
      created_at: r.created_at,
    }));
  }

  await localStore.init();
  return localStore.users.map((u) => ({
    id: u.id,
    username: u.username,
    password_hash: '',
    role: u.role,
    created_at: u.created_at,
  }));
}

export async function createUser(data: {
  username: string;
  password_hash: string;
  role?: 'admin' | 'user';
}): Promise<User> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    const rows = await sql`
      INSERT INTO users (username, password_hash, role)
      VALUES (${data.username}, ${data.password_hash}, ${data.role || 'admin'})
      RETURNING id, username, password_hash, role, created_at;
    `;
    const r = rows[0];
    return {
      id: r.id,
      username: r.username,
      password_hash: r.password_hash,
      role: r.role,
      created_at: r.created_at,
    };
  }

  await localStore.init();
  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    username: data.username,
    password_hash: data.password_hash,
    role: data.role || 'admin',
    created_at: new Date().toISOString(),
  };
  localStore.users.push(newUser);
  return newUser;
}

export async function updateUser(
  id: string,
  data: { username?: string; password_hash?: string; role?: 'admin' | 'user' }
): Promise<User | null> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    const existing = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1;`;
    if (existing.length === 0) return null;
    const current = existing[0];
    const newUsername = data.username !== undefined ? data.username : current.username;
    const newHash = data.password_hash !== undefined ? data.password_hash : current.password_hash;
    const newRole = data.role !== undefined ? data.role : current.role;

    const rows = await sql`
      UPDATE users
      SET
        username = ${newUsername},
        password_hash = ${newHash},
        role = ${newRole}
      WHERE id = ${id}
      RETURNING id, username, password_hash, role, created_at;
    `;
    const r = rows[0];
    return {
      id: r.id,
      username: r.username,
      password_hash: r.password_hash,
      role: r.role,
      created_at: r.created_at,
    };
  }

  await localStore.init();
  const user = localStore.users.find((u) => u.id === id);
  if (!user) return null;
  if (data.username !== undefined) user.username = data.username;
  if (data.password_hash !== undefined) user.password_hash = data.password_hash;
  if (data.role !== undefined) user.role = data.role;
  return user;
}

export async function deleteUser(id: string): Promise<boolean> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    const countRows = await sql`SELECT COUNT(*) as count FROM users;`;
    if (Number(countRows[0]?.count || 0) <= 1) {
      throw new Error('Cannot delete the only admin account in the system');
    }
    await sql`DELETE FROM users WHERE id = ${id};`;
    return true;
  }

  await localStore.init();
  if (localStore.users.length <= 1) {
    throw new Error('Cannot delete the only admin account in the system');
  }
  const prevLen = localStore.users.length;
  localStore.users = localStore.users.filter((u) => u.id !== id);
  return localStore.users.length < prevLen;
}

export async function updateUserPassword(username: string, newHash: string): Promise<boolean> {
  await ensureDatabaseInitialized();
  const sql = getSqlClient();

  if (sql) {
    await sql`UPDATE users SET password_hash = ${newHash} WHERE username = ${username};`;
    return true;
  }

  await localStore.init();
  const user = localStore.users.find((u) => u.username === username);
  if (user) {
    user.password_hash = newHash;
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// Aggregations & Financial Dashboard Metrics
// -------------------------------------------------------------

/**
 * Calculates dynamic member expected amount for a given month based on whether
 * they have already lifted the chit or chit group rules.
 */
export function getMemberExpectedAmountForMonth(
  memberId: string,
  installment: MonthlyInstallment,
  group: ChitGroup,
  priorAuctions: Auction[]
): number {
  // Check if this member won an auction in an earlier month
  const wonPrior = priorAuctions.some(
    (a) => a.winner_member_id === memberId && a.installment_id !== installment.id
  );

  if (wonPrior) {
    return group.after_lift_monthly_amount || 6000;
  }
  return group.regular_member_monthly_amount || 5000;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const group = await getChitGroup();
  const members = await getMembers();
  const installments = await getInstallments();
  const payments = await getPayments();
  const auctions = await getAuctions();

  // Determine current month (default to Month 1 or current chronological)
  const currentInstallment = installments[0] || {
    id: 'default',
    month_number: 1,
    month_name: 'September',
    due_date: '2026-09-10',
    expected_amount: 48000,
  };

  // Month 1 expected / collected
  const m1Payments = payments.filter((p) => p.installment_id === currentInstallment.id);

  // Compute status for all enrolled members in this current month
  const memberStatuses: MemberInstallmentStatus[] = members.map((m) => {
    const memberPayments = m1Payments.filter((p) => p.member_id === m.id);
    const totalPaid = memberPayments.reduce((sum, p) => sum + p.amount, 0);

    // Expected for this member:
    const expected = getMemberExpectedAmountForMonth(m.id, currentInstallment, group, auctions);
    const balance = calculateBalance(expected, totalPaid);
    const status = getPaymentStatus(expected, totalPaid);

    const sortedPayments = [...memberPayments].sort(
      (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );

    return {
      member_id: m.id,
      member_number: m.member_number,
      member_name: m.name,
      phone: m.phone,
      expected_amount: expected,
      paid_amount: totalPaid,
      balance,
      status,
      last_payment_date: sortedPayments[0]?.payment_date || null,
      last_payment_method: sortedPayments[0]?.payment_method || null,
      payments: sortedPayments,
    };
  });

  // Calculate totals for current month
  const expectedThisMonth = currentInstallment.expected_amount || 50000;
  const collectedThisMonth = memberStatuses.reduce((acc, m) => acc + m.paid_amount, 0);
  const pendingThisMonth = Math.max(0, expectedThisMonth - collectedThisMonth);
  const collectionPercentageThisMonth =
    expectedThisMonth > 0 ? Math.min(100, Math.round((collectedThisMonth / expectedThisMonth) * 100)) : 0;

  // Overall totals across all installments
  const totalChitValue = installments.reduce((acc, inst) => acc + inst.expected_amount, 0);
  const totalCollectedOverall = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalOutstandingOverall = Math.max(0, totalChitValue - totalCollectedOverall);

  // Monthly trends
  const monthlyTrends = installments.map((inst) => {
    const instPayments = payments.filter((p) => p.installment_id === inst.id);
    const collected = instPayments.reduce((acc, p) => acc + p.amount, 0);
    return {
      month_name: inst.month_name,
      expected: inst.expected_amount,
      collected,
    };
  });

  return {
    chit_name: group.name,
    total_members: members.length,
    current_month_name: currentInstallment.month_name,
    current_month_number: currentInstallment.month_number,
    total_chit_value: totalChitValue,
    expected_this_month: expectedThisMonth,
    collected_this_month: collectedThisMonth,
    pending_this_month: pendingThisMonth,
    collection_percentage_this_month: collectionPercentageThisMonth,
    total_expected_overall: totalChitValue,
    total_collected_overall: totalCollectedOverall,
    total_outstanding_overall: totalOutstandingOverall,
    member_statuses: memberStatuses,
    monthly_trends: monthlyTrends,
  };
}

export async function getMonthCollectionSummaries(): Promise<MonthCollectionSummary[]> {
  const installments = await getInstallments();
  const payments = await getPayments();
  const auctions = await getAuctions();

  return installments.map((inst, index) => {
    const instPayments = payments.filter((p) => p.installment_id === inst.id);
    const collected = instPayments.reduce((acc, p) => acc + p.amount, 0);
    const pending = Math.max(0, inst.expected_amount - collected);
    const percentage =
      inst.expected_amount > 0 ? Math.min(100, Math.round((collected / inst.expected_amount) * 100)) : 0;

    let status: 'Completed' | 'In Progress' | 'Upcoming' = 'Upcoming';
    if (collected >= inst.expected_amount) {
      status = 'Completed';
    } else if (collected > 0 || index === 0) {
      status = 'In Progress';
    }

    const auction = auctions.find((a) => a.installment_id === inst.id) || null;

    return {
      installment_id: inst.id,
      month_number: inst.month_number,
      month_name: inst.month_name,
      due_date: inst.due_date,
      expected_amount: inst.expected_amount,
      collected_amount: collected,
      pending_amount: pending,
      collection_percentage: percentage,
      status,
      auction,
    };
  });
}

export async function getMonthMemberDetails(installmentId: string): Promise<{
  installment: MonthlyInstallment;
  members: MemberInstallmentStatus[];
  auction: Auction | null;
}> {
  const group = await getChitGroup();
  const allMembers = await getMembers();
  const installments = await getInstallments();
  const installment = installments.find((i) => i.id === installmentId) || installments[0];
  const allPayments = await getPayments({ installment_id: installment.id });
  const auctions = await getAuctions();
  const auction = auctions.find((a) => a.installment_id === installment.id) || null;

  const members: MemberInstallmentStatus[] = allMembers.map((m) => {
    const mPayments = allPayments.filter((p) => p.member_id === m.id);
    const totalPaid = mPayments.reduce((sum, p) => sum + p.amount, 0);
    const expected = getMemberExpectedAmountForMonth(m.id, installment, group, auctions);
    const balance = calculateBalance(expected, totalPaid);
    const status = getPaymentStatus(expected, totalPaid);

    const sortedPayments = [...mPayments].sort(
      (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );

    return {
      member_id: m.id,
      member_number: m.member_number,
      member_name: m.name,
      phone: m.phone,
      expected_amount: expected,
      paid_amount: totalPaid,
      balance,
      status,
      last_payment_date: sortedPayments[0]?.payment_date || null,
      last_payment_method: sortedPayments[0]?.payment_method || null,
      payments: sortedPayments,
    };
  });

  return { installment, members, auction };
}

export async function getMemberOverviewList(): Promise<MemberOverview[]> {
  const group = await getChitGroup();
  const members = await getMembers();
  const installments = await getInstallments();
  const payments = await getPayments();
  const auctions = await getAuctions();

  return members.map((m) => {
    const mPayments = payments.filter((p) => p.member_id === m.id);
    const totalPaid = mPayments.reduce((sum, p) => sum + p.amount, 0);

    // Won auction?
    const wonAuction = auctions.find((a) => a.winner_member_id === m.id);

    // Calculate total expected across all installments
    let totalExpected = 0;
    for (const inst of installments) {
      totalExpected += getMemberExpectedAmountForMonth(m.id, inst, group, auctions);
    }

    const totalPending = Math.max(0, totalExpected - totalPaid);
    const sortedPayments = [...mPayments].sort(
      (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );

    const currentInst = installments[0];
    const m1Payments = mPayments.filter((p) => p.installment_id === currentInst?.id);
    const m1Paid = m1Payments.reduce((sum, p) => sum + p.amount, 0);
    const m1Expected = currentInst ? getMemberExpectedAmountForMonth(m.id, currentInst, group, auctions) : (group.regular_member_monthly_amount || 5000);
    const statusBadge = getPaymentStatus(m1Expected, m1Paid);

    return {
      id: m.id,
      member_number: m.member_number,
      name: m.name,
      phone: m.phone,
      email: m.email,
      address: m.address,
      status: m.status,
      monthly_amount: wonAuction ? group.after_lift_monthly_amount : group.regular_member_monthly_amount,
      total_expected: totalExpected,
      total_paid: totalPaid,
      total_pending: totalPending,
      last_payment_date: sortedPayments[0]?.payment_date || null,
      status_badge: statusBadge,
      has_won_auction: Boolean(wonAuction),
      won_auction_month: wonAuction?.month_name,
    };
  });
}

export async function getDbHealth(): Promise<{
  connected: boolean;
  isNeon: boolean;
  latencyMs: number;
  tableCounts: Record<string, number>;
}> {
  const sql = getSqlClient();
  const start = Date.now();

  if (sql) {
    try {
      const [membersCount, paymentsCount, auctionsCount, groupsCount] = await Promise.all([
        sql`SELECT COUNT(*)::int as count FROM members;`,
        sql`SELECT COUNT(*)::int as count FROM payments;`,
        sql`SELECT COUNT(*)::int as count FROM auctions;`,
        sql`SELECT COUNT(*)::int as count FROM chit_groups;`,
      ]);
      const latency = Date.now() - start;
      return {
        connected: true,
        isNeon: true,
        latencyMs: latency,
        tableCounts: {
          chit_groups: groupsCount[0]?.count || 0,
          members: membersCount[0]?.count || 0,
          payments: paymentsCount[0]?.count || 0,
          auctions: auctionsCount[0]?.count || 0,
        },
      };
    } catch (err) {
      return {
        connected: false,
        isNeon: true,
        latencyMs: Date.now() - start,
        tableCounts: {},
      };
    }
  }

  await localStore.init();
  return {
    connected: true,
    isNeon: false,
    latencyMs: 1,
    tableCounts: {
      chit_groups: localStore.chitGroups.length,
      members: localStore.members.length,
      payments: localStore.payments.length,
      auctions: localStore.auctions.length,
    },
  };
}
