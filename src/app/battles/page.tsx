import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getFriendIds } from "@/lib/friends";
import { createBattle } from "@/app/actions/battles";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BattlesPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const [battles, friendIds] = await Promise.all([
    prisma.battle.findMany({
      where: { OR: [{ challengerId: me.id }, { opponentId: me.id }] },
      include: {
        challenger: { select: { id: true, handle: true, name: true } },
        opponent: { select: { id: true, handle: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getFriendIds(me.id),
  ]);

  const friends = friendIds.length
    ? await prisma.user.findMany({
        where: { id: { in: friendIds } },
        select: { id: true, handle: true, name: true },
      })
    : [];

  type B = (typeof battles)[number];
  const myScore = (b: B) => (b.challengerId === me.id ? b.challengerScore : b.opponentScore);
  const theirScore = (b: B) => (b.challengerId === me.id ? b.opponentScore : b.challengerScore);
  const them = (b: B) => (b.challengerId === me.id ? b.opponent : b.challenger);

  const yourTurn = battles.filter((b) => myScore(b) == null);
  const waiting = battles.filter((b) => myScore(b) != null && theirScore(b) == null);
  const finished = battles.filter((b) => myScore(b) != null && theirScore(b) != null);

  const Row = ({ b, cta }: { b: B; cta: string }) => {
    const t = them(b);
    const mine = myScore(b);
    const their = theirScore(b);
    const result =
      mine != null && their != null
        ? mine > their
          ? "won"
          : mine < their
            ? "lost"
            : "tie"
        : null;
    return (
      <Link
        href={`/battles/${b.id}`}
        className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4 transition hover:border-white/20"
      >
        <div>
          <div className="font-medium">
            vs {t.name ?? `@${t.handle}`}
          </div>
          <div className="text-xs text-neutral-500">{timeAgo(b.createdAt)}</div>
        </div>
        {result ? (
          <div className="flex items-center gap-3">
            <span className="text-sm tabular-nums text-neutral-400">
              {mine} – {their}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                result === "won"
                  ? "bg-amber-400/15 text-amber-300"
                  : result === "lost"
                    ? "bg-rose-500/15 text-rose-300"
                    : "bg-white/10 text-neutral-300"
              }`}
            >
              {result === "won" ? "Won 🏆" : result === "lost" ? "Lost" : "Tie"}
            </span>
          </div>
        ) : (
          <span className="rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-semibold text-neutral-900">
            {cta}
          </span>
        )}
      </Link>
    );
  };

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight">⚔️ Battles</h1>
        <p className="mt-2 text-neutral-500">Challenge a friend to a fragrance quiz duel.</p>

        {/* Challenge a friend */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Challenge a friend
          </h2>
          {friends.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">
              Add friends first —{" "}
              <Link href="/friends" className="text-amber-300 hover:text-amber-200">
                find collectors
              </Link>
              .
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {friends.map((f) => (
                <form key={f.id} action={createBattle.bind(null, f.id)}>
                  <button className="rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-sm font-medium transition hover:border-amber-400/40 hover:text-amber-200">
                    ⚔️ {f.name ?? `@${f.handle}`}
                  </button>
                </form>
              ))}
            </div>
          )}
        </section>

        {yourTurn.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-300/80">
              Your turn ({yourTurn.length})
            </h2>
            <div className="mt-4 space-y-2">
              {yourTurn.map((b) => (
                <Row key={b.id} b={b} cta="Play →" />
              ))}
            </div>
          </section>
        )}

        {waiting.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Waiting for them ({waiting.length})
            </h2>
            <div className="mt-4 space-y-2">
              {waiting.map((b) => (
                <Row key={b.id} b={b} cta="Sent" />
              ))}
            </div>
          </section>
        )}

        {finished.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Finished ({finished.length})
            </h2>
            <div className="mt-4 space-y-2">
              {finished.map((b) => (
                <Row key={b.id} b={b} cta="" />
              ))}
            </div>
          </section>
        )}

        {battles.length === 0 && (
          <p className="mt-10 text-neutral-500">
            No battles yet. Challenge a friend above 👆
          </p>
        )}
      </div>
    </main>
  );
}
