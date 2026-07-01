"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Добавить аромат в коллекцию. Если уже есть — увеличиваем количество.
export async function addToCollection(fragranceId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const existing = await prisma.collectionItem.findFirst({
    where: { userId: user.id, fragranceId, type: "BOTTLE" },
  });

  if (existing) {
    await prisma.collectionItem.update({
      where: { id: existing.id },
      data: { quantity: { increment: 1 } },
    });
  } else {
    const fragrance = await prisma.fragrance.findUnique({
      where: { id: fragranceId },
    });
    if (!fragrance) return;
    await prisma.collectionItem.create({
      data: {
        userId: user.id,
        fragranceId,
        volumeMl: fragrance.retailVolume ?? undefined,
      },
    });
  }

  revalidatePath("/shelf");
  revalidatePath("/catalog");
}

// Изменить количество на delta (+1 / -1). При 0 — удаляем позицию.
export async function changeQuantity(itemId: string, delta: number) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const item = await prisma.collectionItem.findFirst({
    where: { id: itemId, userId: user.id },
  });
  if (!item) return;

  const next = item.quantity + delta;
  if (next <= 0) {
    await prisma.collectionItem.delete({ where: { id: item.id } });
  } else {
    await prisma.collectionItem.update({
      where: { id: item.id },
      data: { quantity: next },
    });
  }

  revalidatePath("/shelf");
}

// Убрать позицию из коллекции.
export async function removeFromCollection(itemId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await prisma.collectionItem.deleteMany({
    where: { id: itemId, userId: user.id },
  });

  revalidatePath("/shelf");
}

// Обновить остаток (в %).
export async function setRemaining(itemId: string, remainingPct: number) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const pct = Math.max(0, Math.min(100, Math.round(remainingPct)));
  await prisma.collectionItem.updateMany({
    where: { id: itemId, userId: user.id },
    data: { remainingPct: pct },
  });

  revalidatePath("/shelf");
}

export async function signOut() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
