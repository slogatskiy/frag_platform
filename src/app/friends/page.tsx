import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCollectionWithValue, fmtUsd } from "@/lib/valuation";
import {
  acceptFriendRequest,
  removeFriendship,
  sendFriendRequest,
} from "@/app/actions/friends";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const { q } = await searchParams;

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ requesterId: me.id }, { addresseeId: me.id }],
    },
    include: { requester: true, addressee: true },
    orderBy: { createdAt: "desc" },
  });

  const accepted = friendships.filter((f) => f.status === "ACCEPTED");
  const incoming = friendships.filter(
    (f) => f.status === "PENDING" && f.addresseeId === me.id
  );
  const outgoing = friendships.filter(
    (f) => f.status === "PENDING" && f.requesterId === me.id
  );

  const other = (f: (typeof friendships)[number]) =>
    f.requesterId === me.id ? f.addressee : f.requester;

  // Стоимость полок друзей.
  const friends = await Promise.all(
    accepted.map(async (f) => {
      const u = other(f);
      const { totalValue, totalBottles } = await getCollectionWithValue(u.id, true);
      return { user: u, totalValue, totalBottles };
    })
  );
  friends.sort((a, b) => b.totalValue - a.totalValue);

  // Поиск людей.
  const relatedIds = new Set(friendships.flatMap((f) => [f.requesterId, f.addresseeId]));
  const found = q
    ? await prisma.user.findMany({
        where: {
          AND: [
            { id: { not: me.id } },
            {
              OR: [
                { handle: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
              ],
            },
          ],
        },
        take: 10,
      })
    : [];

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-6 py-14">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Friends
        </h1>

        {/* Find people */}
        <form className="mt-8" action="/friends">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Find collectors by @handle or name…"
            className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:border-white/25 focus:outline-none"
          />
        </form>

        {found.length > 0 && (
          <div className="mt-4 space-y-2">
            {found.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3"
              >
                <Link href={`/u/${u.handle}`} className="hover:underline">
                  <span className="font-medium">{u.name ?? u.handle}</span>{" "}
                  <span className="text-neutral-500">@{u.handle}</span>
                </Link>
                {!relatedIds.has(u.id) && (
                  <form
                    action={async () => {
                      "use server";
                      await sendFriendRequest(u.id);
                    }}
                  >
                    <button className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold transition hover:border-white/30">
                      + Add
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Incoming requests */}
        {incoming.length > 0 && (
          <section className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Requests ({incoming.length})
            </h2>
            <div className="mt-4 space-y-2">
              {incoming.map((f) => {
                const u = other(f);
                return (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3"
                  >
                    <Link href={`/u/${u.handle}`} className="hover:underline">
                      <span className="font-medium">{u.name ?? u.handle}</span>{" "}
                      <span className="text-neutral-500">@{u.handle}</span>
                    </Link>
                    <div className="flex items-center gap-2">
                      <form
                        action={async () => {
                          "use server";
                          await acceptFriendRequest(f.id);
                        }}
                      >
                        <button className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-900 transition hover:bg-white">
                          Accept
                        </button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await removeFriendship(f.id);
                        }}
                      >
                        <button className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold transition hover:border-white/30">
                          Decline
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Friends list with values */}
        <section className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Your friends ({friends.length})
          </h2>
          {friends.length === 0 ? (
            <p className="mt-4 text-neutral-500">
              No friends yet. Find collectors above and compare shelves.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {friends.map(({ user, totalValue, totalBottles }) => (
                <Link
                  key={user.id}
                  href={`/u/${user.handle}`}
                  className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-5 py-4 transition hover:border-white/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 font-display">
                      {(user.name ?? user.handle).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{user.name ?? user.handle}</div>
                      <div className="text-xs text-neutral-500">
                        @{user.handle} · {totalBottles} bottles
                      </div>
                    </div>
                  </div>
                  <div className="font-display text-lg font-semibold">
                    {fmtUsd(totalValue)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Outgoing */}
        {outgoing.length > 0 && (
          <section className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Sent requests ({outgoing.length})
            </h2>
            <div className="mt-4 space-y-2">
              {outgoing.map((f) => {
                const u = other(f);
                return (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3"
                  >
                    <span className="text-neutral-400">
                      {u.name ?? u.handle}{" "}
                      <span className="text-neutral-600">@{u.handle}</span>
                    </span>
                    <form
                      action={async () => {
                        "use server";
                        await removeFriendship(f.id);
                      }}
                    >
                      <button className="text-xs text-neutral-500 transition hover:text-red-400">
                        Cancel
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
