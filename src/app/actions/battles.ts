"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getFriendIds } from "@/lib/friends";
import { generateQuestions } from "@/lib/quiz";

// Бросить вызов другу: генерим вопросы, создаём баттл, ведём челленджера играть.
export async function createBattle(opponentId: string) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (opponentId === me.id) return;

  // только с друзьями
  const friendIds = await getFriendIds(me.id);
  if (!friendIds.includes(opponentId)) return;

  const questions = await generateQuestions();
  const battle = await prisma.battle.create({
    data: {
      challengerId: me.id,
      opponentId,
      questions: questions as object,
      status: "PENDING",
    },
  });

  redirect(`/battles/${battle.id}`);
}

// Отправить свой счёт. Роль определяется по me.id. Свой счёт ставим один раз.
export async function submitBattleScore(battleId: string, score: number) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const b = await prisma.battle.findUnique({ where: { id: battleId } });
  if (!b) return;

  const s = Math.max(0, Math.min(20, Math.round(score)));

  if (b.challengerId === me.id) {
    if (b.challengerScore == null) {
      await prisma.battle.update({
        where: { id: battleId },
        data: { challengerScore: s },
      });
    }
  } else if (b.opponentId === me.id) {
    if (b.opponentScore == null) {
      await prisma.battle.update({
        where: { id: battleId },
        data: { opponentScore: s, status: "DONE" },
      });
    }
  }

  revalidatePath(`/battles/${battleId}`);
  revalidatePath("/battles");
}
