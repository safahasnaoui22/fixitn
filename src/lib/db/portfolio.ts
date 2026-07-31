import { prisma } from "./client";
import { deleteFile } from "../cloudinary";

export type PortfolioType = "IMAGE" | "VIDEO";

export interface PortfolioItem {
  id: string;
  technicianId: string;
  type: PortfolioType;
  url: string;
  publicId: string;
  caption: string | null;
  createdAt: string;
}

function mapItem(item: {
  id: string;
  technicianId: string;
  type: string;
  url: string;
  publicId: string;
  caption: string | null;
  createdAt: Date;
}): PortfolioItem {
  return {
    ...item,
    type: item.type as PortfolioType,
    createdAt: item.createdAt.toISOString(),
  };
}

export async function listPortfolioItems(
  technicianId: string
): Promise<PortfolioItem[]> {
  const items = await prisma.portfolioItem.findMany({
    where: { technicianId },
    orderBy: { createdAt: "desc" },
  });
  return items.map(mapItem);
}

export async function createPortfolioItem(input: {
  technicianId: string;
  type: PortfolioType;
  url: string;
  publicId: string;
  caption?: string | null;
}): Promise<PortfolioItem> {
  const item = await prisma.portfolioItem.create({
    data: {
      technicianId: input.technicianId,
      type: input.type,
      url: input.url,
      publicId: input.publicId,
      caption: input.caption ?? null,
    },
  });
  return mapItem(item);
}

export async function deletePortfolioItem(
  id: string,
  technicianId: string
): Promise<void> {
  const item = await prisma.portfolioItem.findFirst({
    where: { id, technicianId },
  });
  if (!item) return;

  // Remove from Cloudinary first
  await deleteFile(item.publicId, item.type === "VIDEO");

  // Remove from DB
  await prisma.portfolioItem.delete({ where: { id } });
}

export async function getPortfolioCount(technicianId: string): Promise<number> {
  return prisma.portfolioItem.count({ where: { technicianId } });
}