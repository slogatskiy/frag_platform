"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Отметить «пахну этим сегодня» (SOTD). Дедуп: не чаще раза в 8ч на аромат.
export async function wearToday(fragranceId: string) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (!fragranceId) return;

  const frag = await prisma.fragrance.findUnique({
    where: { id: fragranceId },
    select: { slug: true },
  });
  if (!frag) return;

  const recent = await prisma.wearEntry.findFirst({
    where: {
      userId: me.id,
      fragranceId,
      createdAt: { gt: new Date(Date.now() - 8 * 60 * 60 * 1000) },
    },
  });
  if (!recent) {
    await prisma.wearEntry.create({ data: { userId: me.id, fragranceId } });
  }

  revalidatePath("/feed");
  revalidatePath(`/u/${me.handle}`);
  revalidatePath(`/fragrance/${frag.slug}`);
}

// Сегодняшний SOTD пользователя (последняя отметка за 24ч).
export async function getTodaysWear(userId: string) {
  return prisma.wearEntry.findFirst({
    where: { userId, createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
    include: { fragrance: { include: { brand: true } } },
  });
}
