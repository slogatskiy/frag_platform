import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCollectionWithValue, fmtUsd, itemValue } from "@/lib/valuation";
import { relationTo } from "@/app/actions/friends";
import { BottleThumb } from "@/components/bottle-thumb";
import { FriendButton } from "@/components/friend-button";

export const dynamic = "force-dynamic";

export default async function PublicProfile({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await prisma.user.findUnique({ where: { handle } });
  if (!profile) notFound();

  const me = await getCurrentUser();
  const isOwner = me?.id === profile.id;

  const { items, totalValue, totalBottles, uniqueCount } =
    await getCollectionWithValue(profile.id, !isOwner);

  const wishlist = await prisma.wishlistItem.findMany({
    where: { userId: profile.id },
    include: { fragrance: { include: { brand: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rel = me ? await relationTo(me.id, profile.id) : null;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-6 py-14">
        {/* Profile header */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-gradient-to-b from-white/10 to-transparent font-display text-2xl">
              {(profile.name ?? profile.handle).charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                {profile.name ?? `@${profile.handle}`}
              </h1>
              <div className="text-sm text-neutral-500">@{profile.handle}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {rel && !isOwner && (
              <FriendButton profileId={profile.id} rel={rel} />
            )}
            {!me && (
              <Link
                href="/login"
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-white/30"
              >
                Sign in to add friend
              </Link>
            )}
          </div>
        </div>

        {/* Valuation banner */}
        <div className="mt-8 flex flex-wrap items-center gap-8 rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/[0.06] to-fuchsia-500/[0.04] px-8 py-6">
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              Shelf value
            </div>
            <div className="mt-1 font-display text-4xl font-semibold">
              {fmtUsd(totalValue)}
            </div>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              Bottles
            </div>
            <div className="mt-1 font-display text-2xl font-semibold">
              {totalBottles}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              Unique
            </div>
            <div className="mt-1 font-display text-2xl font-semibold">
              {uniqueCount}
            </div>
          </div>
        </div>

        {/* Collection */}
        <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight">
          Collection
        </h2>
        {items.length === 0 ? (
          <p className="mt-4 text-neutral-500">No public bottles yet.</p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => {
              const retail = it.fragrance.retailPrice
                ? Number(it.fragrance.retailPrice)
                : null;
              return (
                <div
                  key={it.id}
                  className="flex items-start gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5"
                >
                  <BottleThumb
                    imageUrl={it.fragrance.imageUrl}
                    brand={it.fragrance.brand.name}
                    className="h-20 w-16 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-amber-300/70">
                      {it.fragrance.brand.name}
                    </div>
                    <Link
                      href={`/fragrance/${it.fragrance.slug}`}
                      className="mt-1 block font-display text-lg font-semibold leading-snug transition hover:text-white"
                    >
                      {it.fragrance.name}
                    </Link>
                    <div className="mt-1 text-sm text-neutral-500">
                      {it.quantity > 1 ? `×${it.quantity} · ` : ""}
                      {it.remainingPct}% left
                    </div>
                    <div className="mt-2 text-sm font-semibold">
                      {fmtUsd(itemValue(retail, it.remainingPct, it.quantity))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Wishlist */}
        {wishlist.length > 0 && (
          <>
            <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight">
              Wishlist
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {wishlist.map((w) => (
                <span
                  key={w.id}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-neutral-300"
                >
                  <span className="text-neutral-500">{w.fragrance.brand.name}</span>{" "}
                  {w.fragrance.name}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
