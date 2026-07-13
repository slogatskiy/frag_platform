import { prisma } from "@/lib/prisma";

export const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

// Грубая оценка cost-per-wear: ~10 пшиков в 1 мл, 1 носка ≈ 4 пшика →
// из V мл выходит V×2.5 носок. cost-per-wear = цена / (V × 2.5).
const SPRAYS_PER_ML = 10;
const SPRAYS_PER_WEAR = 4;

export function costPerWear(
  retailPrice: number | null,
  volumeMl: number | null
): number | null {
  if (!retailPrice || !volumeMl || volumeMl <= 0) return null;
  const wears = (volumeMl * SPRAYS_PER_ML) / SPRAYS_PER_WEAR;
  if (wears <= 0) return null;
  return retailPrice / wears;
}

export const fmtCostPerWear = (v: number) => `$${v.toFixed(2)}`;

// Стоимость одной позиции: ритейл × доля остатка × количество.
export function itemValue(
  retailPrice: number | null,
  remainingPct: number,
  quantity: number
) {
  if (!retailPrice) return 0;
  return (retailPrice * remainingPct * quantity) / 100;
}

// Коллекция пользователя + суммарная оценка и число флаконов.
export async function getCollectionWithValue(userId: string, publicOnly = false) {
  const items = await prisma.collectionItem.findMany({
    where: { userId, ...(publicOnly ? { isPublic: true } : {}) },
    include: { fragrance: { include: { brand: true } } },
    orderBy: { createdAt: "desc" },
  });

  let totalValue = 0;
  let totalBottles = 0;
  for (const it of items) {
    const retail = it.fragrance.retailPrice ? Number(it.fragrance.retailPrice) : null;
    totalValue += itemValue(retail, it.remainingPct, it.quantity);
    totalBottles += it.quantity;
  }

  return { items, totalValue, totalBottles, uniqueCount: items.length };
}
