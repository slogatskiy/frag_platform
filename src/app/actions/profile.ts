"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Обновить свой профиль: имя, био, аватарка.
export async function updateProfile(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const name = String(formData.get("name") ?? "").trim().slice(0, 50);
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 280);
  const avatarRaw = String(formData.get("avatarUrl") ?? "").trim();
  // Аватарка: "" → снять; ссылка из нашего бакета → поставить;
  // иначе (напр. неизменённый Google-аватар) → не трогаем.
  let avatarPatch: { avatarUrl: string | null } | Record<string, never>;
  if (avatarRaw === "") {
    avatarPatch = { avatarUrl: null };
  } else if (avatarRaw.includes("/storage/v1/object/public/post-images/")) {
    avatarPatch = { avatarUrl: avatarRaw };
  } else {
    avatarPatch = {};
  }

  await prisma.user.update({
    where: { id: me.id },
    data: {
      name: name || null,
      bio: bio || null,
      ...avatarPatch,
    },
  });

  revalidatePath(`/u/${me.handle}`);
  revalidatePath("/feed");
  revalidatePath("/friends");
  redirect(`/u/${me.handle}`);
}
