import { prisma } from "./client";
import { hashPassword } from "../auth";
import type { Role } from "../constants";
import type { User, PublicUser } from "../types";

function mapUser(u: {
  id: string; fullName: string; phone: string; email: string | null;
  passwordHash: string; role: string; city: string | null;
  address: string | null; avatarUrl: string | null;
  faceDescriptor: string | null; sessionVersion: number; createdAt: Date;
}): User {
  return {
    ...u,
    role: u.role as Role,
    createdAt: u.createdAt.toISOString(),
  };
}

export async function findUserByPhone(phone: string): Promise<User | null> {
  const u = await prisma.user.findUnique({ where: { phone } });
  return u ? mapUser(u) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const u = await prisma.user.findUnique({ where: { id } });
  return u ? mapUser(u) : null;
}

export async function getPublicUserById(id: string): Promise<PublicUser | null> {
  const u = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, fullName: true, phone: true, email: true,
      role: true, city: true, address: true, avatarUrl: true,
      sessionVersion: true, createdAt: true,
    },
  });
  if (!u) return null;
  return {
    ...u,
    role: u.role as Role,
    createdAt: u.createdAt.toISOString(),
  };
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
  const passwordHash = await hashPassword(input.password);
  const u = await prisma.user.create({
    data: {
      fullName: input.fullName,
      phone: input.phone,
      email: input.email ?? null,
      passwordHash,
      role: input.role,
      city: input.city ?? null,
      address: input.address ?? null,
      sessionVersion: 0,
    },
  });
  return mapUser(u);
}

export async function updateUserAvatar(
  userId: string,
  avatarUrl: string
): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { avatarUrl } });
}

/**
 * Increments sessionVersion — invalidates all existing sessions for this
 * user on other devices. Called on every successful login.
 * Returns the new version number so it can be embedded in the JWT.
 */
export async function bumpSessionVersion(userId: string): Promise<number> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
  return updated.sessionVersion;
}