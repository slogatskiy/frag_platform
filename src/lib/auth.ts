import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User as DbUser } from "@prisma/client";

// Генерит уникальный handle из email/имени.
function baseHandle(email: string, name?: string | null) {
  const src = (name || email.split("@")[0] || "user").toLowerCase();
  return src.replace(/[^a-z0-9]+/g, "").slice(0, 20) || "user";
}

// Возвращает текущего пользователя (Supabase) и его запись в нашей БД,
// создавая её при первом входе. null — если не залогинен.
export async function getCurrentUser(): Promise<DbUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const existing = await prisma.user.findUnique({ where: { id: user.id } });
  if (existing) return existing;

  // Первый вход — заводим профиль. Подбираем свободный handle.
  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null;
  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ?? null;

  let handle = baseHandle(user.email, name);
  let suffix = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const taken = await prisma.user.findUnique({ where: { handle } });
    if (!taken) break;
    suffix += 1;
    handle = `${baseHandle(user.email, name)}${suffix}`;
  }

  return prisma.user.create({
    data: {
      id: user.id,
      email: user.email,
      handle,
      name,
      avatarUrl,
    },
  });
}
