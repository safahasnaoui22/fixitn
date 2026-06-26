import { db, dbReady } from "../db/client";

export async function getAdminStats() {
  await dbReady;
  const [users, techs, reqs, revenue, disputes] = await Promise.all([
    db.execute("SELECT COUNT(*) as n FROM User WHERE role = 'CLIENT'"),
    db.execute("SELECT COUNT(*) as n FROM Technician"),
    db.execute("SELECT COUNT(*) as n FROM ServiceRequest WHERE date(createdAt) = date('now')"),
    db.execute("SELECT COALESCE(SUM(platformFee),0) as total FROM Payment WHERE type='PAYOUT'"),
    db.execute("SELECT COUNT(*) as n FROM ServiceRequest WHERE status='COMPLETED' AND clientConfirmedSolved=0"),
  ]);
  return {
    totalClients: Number(users.rows[0].n),
    totalTechnicians: Number(techs.rows[0].n),
    jobsToday: Number(reqs.rows[0].n),
    totalRevenue: Number(revenue.rows[0].total),
    disputes: Number(disputes.rows[0].n),
  };
}

export interface AdminUser {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: string;
  city: string | null;
  avatarUrl: string | null;
  createdAt: string;
  jobCount: number;
}

export async function listAdminUsers(role?: string): Promise<AdminUser[]> {
  await dbReady;
  const sql = role
    ? `SELECT u.*,
         CASE WHEN u.role='CLIENT'
           THEN (SELECT COUNT(*) FROM ServiceRequest WHERE clientId=u.id)
           ELSE (SELECT COUNT(*) FROM ServiceRequest sr JOIN Technician t ON t.id=sr.technicianId WHERE t.userId=u.id)
         END as jobCount
       FROM User u WHERE u.role=? ORDER BY u.createdAt DESC`
    : `SELECT u.*,
         CASE WHEN u.role='CLIENT'
           THEN (SELECT COUNT(*) FROM ServiceRequest WHERE clientId=u.id)
           ELSE (SELECT COUNT(*) FROM ServiceRequest sr JOIN Technician t ON t.id=sr.technicianId WHERE t.userId=u.id)
         END as jobCount
       FROM User u ORDER BY u.createdAt DESC`;
  const res = await db.execute({ sql, args: role ? [role] : [] });
  return res.rows.map((r) => ({
    id: r.id as string,
    fullName: r.fullName as string,
    phone: r.phone as string,
    email: (r.email as string | null) ?? null,
    role: r.role as string,
    city: (r.city as string | null) ?? null,
    avatarUrl: (r.avatarUrl as string | null) ?? null,
    createdAt: r.createdAt as string,
    jobCount: Number(r.jobCount ?? 0),
  }));
}

export async function getAdminUserDetail(userId: string) {
  await dbReady;
  const [userRes, recentReqs] = await Promise.all([
    db.execute({ sql: "SELECT * FROM User WHERE id=?", args: [userId] }),
    db.execute({
      sql: `SELECT sr.id, sr.status, sr.createdAt, c.name as categoryName
            FROM ServiceRequest sr
            JOIN Category c ON c.id=sr.categoryId
            WHERE sr.clientId=? ORDER BY sr.createdAt DESC LIMIT 10`,
      args: [userId],
    }),
  ]);
  const user = userRes.rows[0];
  if (!user) return null;
  return {
    id: user.id as string,
    fullName: user.fullName as string,
    phone: user.phone as string,
    email: (user.email as string | null) ?? null,
    role: user.role as string,
    city: (user.city as string | null) ?? null,
    avatarUrl: (user.avatarUrl as string | null) ?? null,
    createdAt: user.createdAt as string,
    recentRequests: recentReqs.rows.map((r) => ({
      id: r.id as string,
      status: r.status as string,
      createdAt: r.createdAt as string,
      categoryName: r.categoryName as string,
    })),
  };
}

export async function deleteUser(userId: string): Promise<void> {
  await dbReady;
  await db.execute({ sql: "DELETE FROM User WHERE id=?", args: [userId] });
}

export interface AdminTechnician {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  title: string;
  city: string | null;
  verified: boolean;
  planKey: string | null;
  startingPrice: number;
  ratingAvg: number | null;
  ratingCount: number;
  jobsCompleted: number;
  createdAt: string;
}

export async function listAdminTechnicians(): Promise<AdminTechnician[]> {
  await dbReady;
  const res = await db.execute(`
    SELECT t.*, u.fullName, u.phone, u.avatarUrl, u.city,
      p.key as planKey,
      (SELECT AVG(rating) FROM Review WHERE technicianId=t.id) as ratingAvg,
      (SELECT COUNT(*) FROM Review WHERE technicianId=t.id) as ratingCount,
      (SELECT COUNT(*) FROM ServiceRequest WHERE technicianId=t.id AND status='COMPLETED') as jobsCompleted
    FROM Technician t
    JOIN User u ON u.id=t.userId
    LEFT JOIN Plan p ON p.id=t.planId
    ORDER BY t.createdAt DESC
  `);
  return res.rows.map((r) => ({
    id: r.id as string,
    userId: r.userId as string,
    fullName: r.fullName as string,
    phone: r.phone as string,
    avatarUrl: (r.avatarUrl as string | null) ?? null,
    title: r.title as string,
    city: (r.city as string | null) ?? null,
    verified: Boolean(r.verified),
    planKey: (r.planKey as string | null) ?? null,
    startingPrice: r.startingPrice as number,
    ratingAvg: r.ratingAvg == null ? null : Number(r.ratingAvg),
    ratingCount: Number(r.ratingCount ?? 0),
    jobsCompleted: Number(r.jobsCompleted ?? 0),
    createdAt: r.createdAt as string,
  }));
}

export async function getAdminTechnicianDetail(technicianId: string) {
  await dbReady;
  const [techRes, categories, recentReqs, earnings] = await Promise.all([
    db.execute({
      sql: `SELECT t.*, u.fullName, u.phone, u.email, u.avatarUrl, u.city, u.createdAt as userCreatedAt,
              p.key as planKey, p.name as planName, p.commissionRate
            FROM Technician t JOIN User u ON u.id=t.userId LEFT JOIN Plan p ON p.id=t.planId WHERE t.id=?`,
      args: [technicianId],
    }),
    db.execute({
      sql: `SELECT c.name FROM Category c JOIN TechnicianCategory tc ON tc.categoryId=c.id WHERE tc.technicianId=?`,
      args: [technicianId],
    }),
    db.execute({
      sql: `SELECT sr.id, sr.status, sr.createdAt, c.name as categoryName, u.fullName as clientName
            FROM ServiceRequest sr JOIN Category c ON c.id=sr.categoryId JOIN User u ON u.id=sr.clientId
            WHERE sr.technicianId=? ORDER BY sr.createdAt DESC LIMIT 10`,
      args: [technicianId],
    }),
    db.execute({
      sql: `SELECT COALESCE(SUM(amount-platformFee),0) as net, COALESCE(SUM(platformFee),0) as fees
            FROM Payment WHERE technicianId=? AND type='PAYOUT'`,
      args: [technicianId],
    }),
  ]);
  const t = techRes.rows[0];
  if (!t) return null;
  return {
    id: t.id as string,
    userId: t.userId as string,
    fullName: t.fullName as string,
    phone: t.phone as string,
    email: (t.email as string | null) ?? null,
    avatarUrl: (t.avatarUrl as string | null) ?? null,
    city: (t.city as string | null) ?? null,
    title: t.title as string,
    bio: (t.bio as string | null) ?? null,
    yearsExperience: t.yearsExperience as number,
    startingPrice: t.startingPrice as number,
    verified: Boolean(t.verified),
    planKey: (t.planKey as string | null) ?? null,
    planName: (t.planName as string | null) ?? null,
    commissionRate: t.commissionRate == null ? null : Number(t.commissionRate),
    createdAt: t.userCreatedAt as string,
    categories: categories.rows.map((r) => r.name as string),
    recentRequests: recentReqs.rows.map((r) => ({
      id: r.id as string,
      status: r.status as string,
      createdAt: r.createdAt as string,
      categoryName: r.categoryName as string,
      clientName: r.clientName as string,
    })),
    netEarnings: Number(earnings.rows[0]?.net ?? 0),
    feesCollected: Number(earnings.rows[0]?.fees ?? 0),
  };
}

export async function setTechnicianVerified(technicianId: string, verified: boolean): Promise<void> {
  await dbReady;
  await db.execute({ sql: "UPDATE Technician SET verified=? WHERE id=?", args: [verified ? 1 : 0, technicianId] });
}

export interface AdminRequest {
  id: string;
  status: string;
  categoryName: string;
  clientFullName: string;
  technicianFullName: string;
  createdAt: string;
  completedAt: string | null;
  clientConfirmedSolved: boolean | null;
}

export async function listAdminRequests(status?: string): Promise<AdminRequest[]> {
  await dbReady;
  const sql = status
    ? `SELECT sr.id, sr.status, sr.createdAt, sr.completedAt, sr.clientConfirmedSolved,
         c.name as categoryName, cu.fullName as clientFullName, tu.fullName as technicianFullName
       FROM ServiceRequest sr
       JOIN Category c ON c.id=sr.categoryId
       JOIN User cu ON cu.id=sr.clientId
       JOIN Technician t ON t.id=sr.technicianId JOIN User tu ON tu.id=t.userId
       WHERE sr.status=? ORDER BY sr.createdAt DESC`
    : `SELECT sr.id, sr.status, sr.createdAt, sr.completedAt, sr.clientConfirmedSolved,
         c.name as categoryName, cu.fullName as clientFullName, tu.fullName as technicianFullName
       FROM ServiceRequest sr
       JOIN Category c ON c.id=sr.categoryId
       JOIN User cu ON cu.id=sr.clientId
       JOIN Technician t ON t.id=sr.technicianId JOIN User tu ON tu.id=t.userId
       ORDER BY sr.createdAt DESC`;
  const res = await db.execute({ sql, args: status ? [status] : [] });
  return res.rows.map((r) => ({
    id: r.id as string,
    status: r.status as string,
    categoryName: r.categoryName as string,
    clientFullName: r.clientFullName as string,
    technicianFullName: r.technicianFullName as string,
    createdAt: r.createdAt as string,
    completedAt: (r.completedAt as string | null) ?? null,
    clientConfirmedSolved: r.clientConfirmedSolved == null ? null : Boolean(r.clientConfirmedSolved),
  }));
}