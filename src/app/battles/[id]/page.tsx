import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { BattlePlay } from "@/components/battle-play";
import type { QuizQuestion } from "@/lib/quiz";

export const dynamic = "force-dynamic";

export default async function BattlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const b = await prisma.battle.findUnique({
    where: { id },
    include: {
      challenger: { select: { handle: true, name: true } },
      opponent: { select: { handle: true, name: true } },
    },
  });
  if (!b) notFound();

  const iAmChallenger = b.challengerId === me.id;
  const iAmOpponent = b.opponentId === me.id;
  if (!iAmChallenger && !iAmOpponent) notFound();

  const myScore = iAmChallenger ? b.challengerScore : b.opponentScore;
  const theirScore = iAmChallenger ? b.opponentScore : b.challengerScore;
  const them = iAmChallenger ? b.opponent : b.challenger;
  const themName = them.name ?? `@${them.handle}`;

  // Мне ещё играть — играем.
  if (myScore == null) {
    const questions = b.questions as unknown as QuizQuestion[];
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="text-center">
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              ⚔️ Battle vs {themName}
            </h1>
            <p className="mt-2 text-neutral-500">
              Same 8 questions. Beat their score.
            </p>
          </div>
          <div className="mt-10">
            <BattlePlay battleId={b.id} questions={questions} />
          </div>
        </div>
      </main>
    );
  }

  // Я сыграл — результат / ожидание.
  const total = (b.questions as unknown as QuizQuestion[]).length;
  const waiting = theirScore == null;
  const iWon = !waiting && myScore > (theirScore as number);
  const tie = !waiting && myScore === theirScore;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-md px-6 py-16">
        <Link href="/battles" className="text-sm text-neutral-500 transition hover:text-neutral-300">
          ← Battles
        </Link>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
          {waiting ? (
            <>
              <div className="font-display text-2xl font-semibold">Score locked in</div>
              <div className="mt-2 text-5xl font-display font-semibold text-amber-300">
                {myScore}
                <span className="text-2xl text-neutral-600">/{total}</span>
              </div>
              <p className="mt-4 text-neutral-400">
                Waiting for <span className="text-neutral-200">{themName}</span> to play…
              </p>
            </>
          ) : (
            <>
              <div className="font-display text-3xl font-semibold">
                {tie ? "It's a tie 🤝" : iWon ? "You won 🏆" : "You lost 😤"}
              </div>
              <div className="mt-6 flex items-center justify-center gap-6">
                <div>
                  <div className="text-xs uppercase tracking-wide text-neutral-500">You</div>
                  <div className={`font-display text-4xl font-semibold ${iWon ? "text-amber-300" : "text-neutral-200"}`}>
                    {myScore}
                  </div>
                </div>
                <div className="text-neutral-600">vs</div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-neutral-500">{themName}</div>
                  <div className={`font-display text-4xl font-semibold ${!iWon && !tie ? "text-amber-300" : "text-neutral-200"}`}>
                    {theirScore}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-neutral-600">out of {total}</div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Link href="/battles" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-white/30">
            All battles
          </Link>
          <Link href="/quiz" className="rounded-full bg-neutral-100 px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-white">
            Solo quiz
          </Link>
        </div>
      </div>
    </main>
  );
}
