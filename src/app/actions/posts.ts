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
  const imageRaw = String(formData.get("imageUrl") ?? "").trim();
  // Принимаем только ссылку на наш Supabase Storage-бакет
  const imageUrl =
    imageRaw && imageRaw.includes("/storage/v1/object/public/post-images/")
      ? imageRaw
      : null;

  if (!fragranceId) return;
  if (!body && rating == null && !imageUrl) return; // пустой пост не создаём

  const frag = await prisma.fragrance.findUnique({
    where: { id: fragranceId },
    select: { slug: true },
  });
  if (!frag) return;

  const post = await prisma.post.create({
    data: { userId: me.id, fragranceId, body, rating, imageUrl },
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

// Комментарий к посту.
export async function createComment(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const postId = String(formData.get("postId") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 1000);
  if (!postId || !body) return;

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return;

  await prisma.comment.create({ data: { postId, userId: me.id, body } });
  revalidatePath(`/p/${postId}`);
  revalidatePath("/feed");
}

export async function deleteComment(commentId: string) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const c = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { postId: true, userId: true },
  });
  if (!c || c.userId !== me.id) return;

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/p/${c.postId}`);
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
