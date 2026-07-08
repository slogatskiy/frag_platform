"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseNotes } from "@/lib/notes";

// Сохранить любимые ноты в профиль (из строки "a,b,c").
export async function saveFavoriteNotes(notesCsv: string) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const notes = parseNotes(notesCsv);
  await prisma.user.update({
    where: { id: me.id },
    data: { favoriteNotes: notes },
  });
  revalidatePath("/discover");
}
