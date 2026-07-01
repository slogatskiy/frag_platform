import { prisma } from "@/lib/prisma";

export const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

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
