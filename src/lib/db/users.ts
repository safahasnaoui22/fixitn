import { db, dbReady, genId } from "./client";
import { hashPassword } from "../auth";
import type { Role } from "../constants";
import type { User, PublicUser } from "../types";

function now(): string {
  return new Date().toISOString();
}

function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export async function findUserByPhone(phone: string): Promise<User | null> {
  await dbReady;
  const res = await db.execute({
    sql: "SELECT * FROM User WHERE phone = ?",
    args: [phone],
  });
  return (res.rows[0] as unknown as User) ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  await dbReady;
  const res = await db.execute({ sql: "SELECT * FROM User WHERE id = ?", args: [id] });
  return (res.rows[0] as unknown as User) ?? null;
}

export async function getPublicUserById(id: string): Promise<PublicUser | null> {
  const user = await findUserById(id);
  return user ? toPublicUser(user) : null;
}

export async function createUser(input: {
  fullName: string;
  phone: string;
  email?: string | null;
  password: string;
  role: Role;
  city?: string | null;
  address?: string | null;
}): Promise<User> {
  await dbReady;
  const id = genId();
  const passwordHash = await hashPassword(input.password);
  const createdAt = now();
  await db.execute({
    sql: `INSERT INTO User (id, fullName, phone, email, passwordHash, role, city, address, avatarUrl, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
    args: [
      id,
      input.fullName,
      input.phone,
      input.email ?? null,
      passwordHash,
      input.role,
      input.city ?? null,
      input.address ?? null,
      createdAt,
    ],
  });
  return {
    id,
    fullName: input.fullName,
    phone: input.phone,
    email: input.email ?? null,
    passwordHash,
    role: input.role,
    city: input.city ?? null,
    address: input.address ?? null,
    avatarUrl: null,
    createdAt,
  };
}

export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
  await dbReady;
  await db.execute({
    sql: "UPDATE User SET avatarUrl = ? WHERE id = ?",
    args: [avatarUrl, userId],
  });
}