import { db, dbReady, genId } from "./client";
import type { ReviewWithAuthor } from "../types";

function now(): string {
  return new Date().toISOString();
}

function mapReview(row: Record<string, unknown>): ReviewWithAuthor {
  return {
    id: row.id as string,
    requestId: row.requestId as string,
    technicianId: row.technicianId as string,
    authorId: row.authorId as string,
    rating: row.rating as number,
    comment: (row.comment as string | null) ?? null,
    createdAt: row.createdAt as string,
    authorFullName: row.authorFullName as string,
    authorAvatarUrl: (row.authorAvatarUrl as string | null) ?? null,
  };
}

export async function createReview(input: {
  requestId: string;
  technicianId: string;
  authorId: string;
  rating: number;
  comment?: string | null;
}): Promise<void> {
  await dbReady;
  await db.execute({
    sql: `INSERT INTO Review (id, requestId, technicianId, authorId, rating, comment, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      genId(),
      input.requestId,
      input.technicianId,
      input.authorId,
      input.rating,
      input.comment ?? null,
      now(),
    ],
  });
}

export async function getReviewByRequestId(requestId: string): Promise<{ id: string } | null> {
  await dbReady;
  const res = await db.execute({
    sql: "SELECT id FROM Review WHERE requestId = ?",
    args: [requestId],
  });
  const row = res.rows[0];
  return row ? { id: row.id as string } : null;
}

export async function listReviewsForTechnician(technicianId: string): Promise<ReviewWithAuthor[]> {
  await dbReady;
  const res = await db.execute({
    sql: `SELECT r.*, u.fullName as authorFullName, u.avatarUrl as authorAvatarUrl
          FROM Review r JOIN User u ON u.id = r.authorId
          WHERE r.technicianId = ? ORDER BY r.createdAt DESC`,
    args: [technicianId],
  });
  return res.rows.map((r) => mapReview(r as unknown as Record<string, unknown>));
}

export async function getRatingBreakdown(
  technicianId: string
): Promise<{ counts: Record<1 | 2 | 3 | 4 | 5, number>; avg: number | null; total: number }> {
  await dbReady;
  const res = await db.execute({
    sql: "SELECT rating, COUNT(*) as n FROM Review WHERE technicianId = ? GROUP BY rating",
    args: [technicianId],
  });
  const counts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;
  for (const row of res.rows) {
    const rating = Number(row.rating) as 1 | 2 | 3 | 4 | 5;
    const n = Number(row.n);
    counts[rating] = n;
    total += n;
    sum += rating * n;
  }
  return { counts, avg: total > 0 ? sum / total : null, total };
}