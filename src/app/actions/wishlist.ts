"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function addToWishlist(fragranceId: string) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  await prisma.wishlistItem.upsert({
    where: { userId_fragranceId: { userId: me.id, fragranceId } },
    update: {},
    create: { userId: me.id, fragranceId },
  });

  revalidatePath("/wishlist");
  revalidatePath("/catalog");
}

export async function removeFromWishlist(fragranceId: string) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  await prisma.wishlistItem.deleteMany({
    where: { userId: me.id, fragranceId },
  });

  revalidatePath("/wishlist");
  revalidatePath("/catalog");
}
