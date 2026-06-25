import { db, dbReady, genId } from "./client";
import { parseStringArray, toStringArray } from "../utils";
import type { Category, Technician, TechnicianWithUser } from "../types";

function now(): string {
  return new Date().toISOString();
}

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    icon: row.icon as string,
    color: row.color as string,
    description: (row.description as string | null) ?? null,
    howItWorks: parseStringArray(row.howItWorks as string | null),
    videoUrl: (row.videoUrl as string | null) ?? null,
    ratingAvg: (row.ratingAvg as number | null) ?? null,
    ratingCount: (row.ratingCount as number | null) ?? null,
    sortOrder: row.sortOrder as number,
  };
}

function mapTechnicianWithUser(row: Record<string, unknown>): TechnicianWithUser {
  return {
    id: row.id as string,
    userId: row.userId as string,
    title: row.title as string,
    bio: (row.bio as string | null) ?? null,
    yearsExperience: row.yearsExperience as number,
    startingPrice: row.startingPrice as number,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    verified: Boolean(row.verified),
    galleryImages: parseStringArray(row.galleryImages as string | null),
    planId: (row.planId as string | null) ?? null,
    createdAt: row.createdAt as string,
    fullName: row.fullName as string,
    avatarUrl: (row.avatarUrl as string | null) ?? null,
    phone: row.phone as string,
    ratingAvg: row.ratingAvg == null ? null : Number(row.ratingAvg),
    ratingCount: Number(row.ratingCount ?? 0),
  };
}

const TECHNICIAN_WITH_USER_SELECT = `
  SELECT t.*, u.fullName as fullName, u.avatarUrl as avatarUrl, u.phone as phone,
    (SELECT AVG(rating) FROM Review WHERE technicianId = t.id) as ratingAvg,
    (SELECT COUNT(*) FROM Review WHERE technicianId = t.id) as ratingCount
  FROM Technician t
  JOIN User u ON u.id = t.userId
`;

export async function listCategories(): Promise<Category[]> {
  await dbReady;
  const res = await db.execute("SELECT * FROM Category ORDER BY sortOrder ASC");
  return res.rows.map((r) => mapCategory(r as unknown as Record<string, unknown>));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  await dbReady;
  const res = await db.execute({ sql: "SELECT * FROM Category WHERE slug = ?", args: [slug] });
  const row = res.rows[0];
  return row ? mapCategory(row as unknown as Record<string, unknown>) : null;
}

export async function listTechniciansByCategorySlug(
  slug: string
): Promise<TechnicianWithUser[]> {
  await dbReady;
  const res = await db.execute({
    sql: `${TECHNICIAN_WITH_USER_SELECT}
          JOIN TechnicianCategory tc ON tc.technicianId = t.id
          JOIN Category c ON c.id = tc.categoryId
          WHERE c.slug = ?
          ORDER BY t.verified DESC, ratingAvg DESC`,
    args: [slug],
  });
  return res.rows.map((r) => mapTechnicianWithUser(r as unknown as Record<string, unknown>));
}

export async function getTechnicianById(id: string): Promise<TechnicianWithUser | null> {
  await dbReady;
  const res = await db.execute({
    sql: `${TECHNICIAN_WITH_USER_SELECT} WHERE t.id = ?`,
    args: [id],
  });
  const row = res.rows[0];
  return row ? mapTechnicianWithUser(row as unknown as Record<string, unknown>) : null;
}

export async function getTechnicianByUserId(userId: string): Promise<TechnicianWithUser | null> {
  await dbReady;
  const res = await db.execute({
    sql: `${TECHNICIAN_WITH_USER_SELECT} WHERE t.userId = ?`,
    args: [userId],
  });
  const row = res.rows[0];
  return row ? mapTechnicianWithUser(row as unknown as Record<string, unknown>) : null;
}

export async function listCategoriesForTechnician(technicianId: string): Promise<Category[]> {
  await dbReady;
  const res = await db.execute({
    sql: `SELECT c.* FROM Category c
          JOIN TechnicianCategory tc ON tc.categoryId = c.id
          WHERE tc.technicianId = ? ORDER BY c.sortOrder ASC`,
    args: [technicianId],
  });
  return res.rows.map((r) => mapCategory(r as unknown as Record<string, unknown>));
}

export async function createTechnicianProfile(input: {
  userId: string;
  title: string;
  bio?: string | null;
  yearsExperience?: number;
  startingPrice?: number;
  categoryIds: string[];
  planId: string;
}): Promise<Technician> {
  await dbReady;
  const id = genId();
  const createdAt = now();
  await db.execute({
    sql: `INSERT INTO Technician
      (id, userId, title, bio, yearsExperience, startingPrice, latitude, longitude, verified, galleryImages, planId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, 36.8065, 10.1815, 0, ?, ?, ?)`,
    args: [
      id,
      input.userId,
      input.title,
      input.bio ?? null,
      input.yearsExperience ?? 0,
      input.startingPrice ?? 0,
      toStringArray([]),
      input.planId,
      createdAt,
    ],
  });
  for (const categoryId of input.categoryIds) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO TechnicianCategory (technicianId, categoryId) VALUES (?, ?)",
      args: [id, categoryId],
    });
  }
  return {
    id,
    userId: input.userId,
    title: input.title,
    bio: input.bio ?? null,
    yearsExperience: input.yearsExperience ?? 0,
    startingPrice: input.startingPrice ?? 0,
    latitude: 36.8065,
    longitude: 10.1815,
    verified: false,
    galleryImages: [],
    planId: input.planId,
    createdAt,
  };
}

export async function updateTechnicianProfile(
  technicianId: string,
  input: { title: string; bio: string | null; yearsExperience: number; startingPrice: number }
): Promise<void> {
  await dbReady;
  await db.execute({
    sql: `UPDATE Technician SET title = ?, bio = ?, yearsExperience = ?, startingPrice = ? WHERE id = ?`,
    args: [input.title, input.bio, input.yearsExperience, input.startingPrice, technicianId],
  });
}

export async function getTechnicianStats(
  technicianId: string
): Promise<{ jobsCompleted: number; satisfactionPct: number | null }> {
  await dbReady;
  const completedRes = await db.execute({
    sql: "SELECT COUNT(*) as n FROM ServiceRequest WHERE technicianId = ? AND status = 'COMPLETED'",
    args: [technicianId],
  });
  const jobsCompleted = Number(completedRes.rows[0]?.n ?? 0);

  const solvedRes = await db.execute({
    sql: `SELECT
            SUM(CASE WHEN clientConfirmedSolved = 1 THEN 1 ELSE 0 END) as solved,
            SUM(CASE WHEN clientConfirmedSolved IS NOT NULL THEN 1 ELSE 0 END) as answered
          FROM ServiceRequest WHERE technicianId = ? AND status = 'COMPLETED'`,
    args: [technicianId],
  });
  const solved = Number(solvedRes.rows[0]?.solved ?? 0);
  const answered = Number(solvedRes.rows[0]?.answered ?? 0);
  const satisfactionPct = answered > 0 ? Math.round((solved / answered) * 100) : null;

  return { jobsCompleted, satisfactionPct };
}