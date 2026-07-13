"use client";

import { useRouter } from "next/navigation";
import { QuizGame } from "@/components/quiz-game";
import { submitBattleScore } from "@/app/actions/battles";
import type { QuizQuestion } from "@/lib/quiz";

export function BattlePlay({
  battleId,
  questions,
}: {
  battleId: string;
  questions: QuizQuestion[];
}) {
  const router = useRouter();
  return (
    <QuizGame
      fixedQuestions={questions}
      onComplete={async (score) => {
        await submitBattleScore(battleId, score);
        router.refresh();
      }}
    />
  );
}
