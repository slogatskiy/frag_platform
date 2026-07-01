"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Отправить заявку в друзья по id пользователя.
export async function sendFriendRequest(addresseeId: string) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.id === addresseeId) return;

  // Уже есть связь в любую сторону?
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: me.id, addresseeId },
        { requesterId: addresseeId, addresseeId: me.id },
      ],
    },
  });
  if (existing) {
    // Если это входящая заявка — принимаем её.
    if (existing.status === "PENDING" && existing.addresseeId === me.id) {
      await prisma.friendship.update({
        where: { id: existing.id },
        data: { status: "ACCEPTED" },
      });
    }
  } else {
    await prisma.friendship.create({
      data: { requesterId: me.id, addresseeId, status: "PENDING" },
    });
  }

  revalidatePath("/friends");
  revalidatePath("/u");
}

export async function acceptFriendRequest(friendshipId: string) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  await prisma.friendship.updateMany({
    where: { id: friendshipId, addresseeId: me.id, status: "PENDING" },
    data: { status: "ACCEPTED" },
  });
  revalidatePath("/friends");
}

// Отклонить входящую заявку или удалить из друзей / отменить исходящую.
export async function removeFriendship(friendshipId: string) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  await prisma.friendship.deleteMany({
    where: {
      id: friendshipId,
      OR: [{ requesterId: me.id }, { addresseeId: me.id }],
    },
  });
  revalidatePath("/friends");
}

// Статус связи между мной и другим пользователем.
export type RelStatus =
  | { kind: "none" }
  | { kind: "friends"; friendshipId: string }
  | { kind: "outgoing"; friendshipId: string }
  | { kind: "incoming"; friendshipId: string }
  | { kind: "self" };

export async function relationTo(
  meId: string,
  otherId: string
): Promise<RelStatus> {
  if (meId === otherId) return { kind: "self" };
  const f = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: meId, addresseeId: otherId },
        { requesterId: otherId, addresseeId: meId },
      ],
    },
  });
  if (!f) return { kind: "none" };
  if (f.status === "ACCEPTED") return { kind: "friends", friendshipId: f.id };
  if (f.requesterId === meId) return { kind: "outgoing", friendshipId: f.id };
  return { kind: "incoming", friendshipId: f.id };
}
