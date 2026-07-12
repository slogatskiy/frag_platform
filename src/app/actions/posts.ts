"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Создать пост-впечатление об аромате. Нужен рейтинг ИЛИ текст.
export async function createPost(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const fragranceId = String(formData.get("fragranceId") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const rating = ratingRaw ? Math.max(1, Math.min(10, parseInt(ratingRaw, 10))) : null;

  if (!fragranceId) return;
  if (!body && rating == null) return; // пустой пост не создаём

  const frag = await prisma.fragrance.findUnique({
    where: { id: fragranceId },
    select: { slug: true },
  });
  if (!frag) return;

  const post = await prisma.post.create({
    data: { userId: me.id, fragranceId, body, rating },
  });

  revalidatePath("/feed");
  revalidatePath(`/fragrance/${frag.slug}`);
  revalidatePath(`/u/${me.handle}`);
  redirect(`/p/${post.id}`);
}

export async function deletePost(postId: string) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  await prisma.post.deleteMany({ where: { id: postId, userId: me.id } });
  revalidatePath("/feed");
}

// Лайк/анлайк поста (тоггл).
export async function toggleLike(postId: string) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const existing = await prisma.postLike.findUnique({
    where: { userId_postId: { userId: me.id, postId } },
  });
  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.postLike.create({ data: { userId: me.id, postId } });
  }

  revalidatePath("/feed");
  revalidatePath(`/p/${postId}`);
}
