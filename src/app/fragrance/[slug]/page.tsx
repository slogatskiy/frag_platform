import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { fmtUsd } from "@/lib/valuation";
import { addToCollection } from "@/app/actions/collection";
import { addToWishlist, removeFromWishlist } from "@/app/actions/wishlist";
import { BottleThumb } from "@/components/bottle-thumb";

export const dynamic = "force-dynamic";

const CONC_LABEL: Record<string, string> = {
  PARFUM: "Parfum",
  EDP: "Eau de Parfum",
  EDT: "Eau de Toilette",
  EDC: "Eau de Cologne",
  EXTRAIT: "Extrait",
  OTHER: "",
};

function NoteRow({ label, notes }: { label: string; notes: string[] }) {
  if (!notes.length) return null;
  return (
    <div className="flex flex-col gap-2 border-t border-white/5 py-4 sm:flex-row sm:items-baseline sm:gap-6">
      <div className="w-24 shrink-0 text-xs uppercase tracking-wider text-neutral-500">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {notes.map((n) => (
          <Link
            key={n}
            href={`/discover?notes=${encodeURIComponent(n)}`}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm text-neutral-300 transition hover:border-amber-400/40 hover:text-amber-200"
          >
            {n}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function FragrancePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const f = await prisma.fragrance.findUnique({
    where: { slug },
    include: { brand: true },
  });
  if (!f) notFound();

  const me = await getCurrentUser().catch(() => null);

  // Моя коллекция/вишлист по этому аромату
  const [myItem, myWish, ownersCount] = await Promise.all([
    me
      ? prisma.collectionItem.findFirst({ where: { userId: me.id, fragranceId: f.id } })
      : null,
    me
      ? prisma.wishlistItem.findFirst({ where: { userId: me.id, fragranceId: f.id } })
      : null,
    prisma.collectionItem.findMany({
      where: { fragranceId: f.id },
      distinct: ["userId"],
      select: { userId: true },
    }),
  ]);

  // Друзья, у кого этот аромат есть / в вишлисте
  let friendsOwn: { handle: string; name: string | null }[] = [];
  let friendsWant: { handle: string; name: string | null }[] = [];
  if (me) {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: me.id }, { addresseeId: me.id }],
      },
      select: { requesterId: true, addresseeId: true },
    });
    const friendIds = friendships.map((fr) =>
      fr.requesterId === me.id ? fr.addresseeId : fr.requesterId
    );
    if (friendIds.length) {
      const [own, want] = await Promise.all([
        prisma.collectionItem.findMany({
          where: { fragranceId: f.id, userId: { in: friendIds } },
          distinct: ["userId"],
          include: { user: { select: { handle: true, name: true } } },
        }),
        prisma.wishlistItem.findMany({
          where: { fragranceId: f.id, userId: { in: friendIds } },
          include: { user: { select: { handle: true, name: true } } },
        }),
      ]);
      friendsOwn = own.map((o) => o.user);
      friendsWant = want.map((w) => w.user);
    }
  }

  const retail = f.retailPrice ? Number(f.retailPrice) : null;
  const wished = !!myWish;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link
          href="/catalog"
          className="text-sm text-neutral-500 transition hover:text-neutral-300"
        >
          ← Catalog
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[340px_1fr]">
          {/* Photo */}
          <div>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <BottleThumb
                imageUrl={f.imageUrl}
                brand={f.brand.name}
                className="mx-auto aspect-[3/4] w-full max-w-xs"
              />
            </div>
          </div>

          {/* Info */}
          <div>
            <Link
              href={`/catalog?q=${encodeURIComponent(f.brand.name)}`}
              className="text-sm uppercase tracking-wider text-amber-300/70 transition hover:text-amber-200"
            >
              {f.brand.name}
            </Link>
            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">
              {f.name}
            </h1>
            <div className="mt-2 text-neutral-400">
              {f.concentration ? CONC_LABEL[f.concentration] : ""}
              {f.concentration && f.releaseYear ? " · " : ""}
              {f.releaseYear ?? ""}
              {retail != null && (
                <span className="ml-2 text-neutral-300">· ~{fmtUsd(retail)}</span>
              )}
            </div>

            {ownersCount.length > 0 && (
              <div className="mt-3 text-sm text-neutral-500">
                In {ownersCount.length} collection
                {ownersCount.length === 1 ? "" : "s"} on Frag
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <form
                action={async () => {
                  "use server";
                  await addToCollection(f.id);
                }}
              >
                <button className="rounded-full bg-neutral-100 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white">
                  {myItem ? `In collection ✓ (×${myItem.quantity})` : "+ Add to collection"}
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  if (wished) await removeFromWishlist(f.id);
                  else await addToWishlist(f.id);
                }}
              >
                <button
                  className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
                    wished
                      ? "border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-300"
                      : "border-white/15 text-neutral-200 hover:border-white/30"
                  }`}
                >
                  {wished ? "♥ Wishlisted" : "♡ Wishlist"}
                </button>
              </form>
            </div>

            {/* Notes */}
            {(f.notesTop.length || f.notesHeart.length || f.notesBase.length) > 0 && (
              <div className="mt-10">
                <h2 className="font-display text-xl font-semibold">Notes</h2>
                <div className="mt-2">
                  <NoteRow label="Top" notes={f.notesTop} />
                  <NoteRow label="Heart" notes={f.notesHeart} />
                  <NoteRow label="Base" notes={f.notesBase} />
                </div>
              </div>
            )}

            {/* Friends */}
            {me && (friendsOwn.length > 0 || friendsWant.length > 0) && (
              <div className="mt-10">
                <h2 className="font-display text-xl font-semibold">
                  Among your friends
                </h2>
                {friendsOwn.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs uppercase tracking-wide text-neutral-500">
                      Owns it
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {friendsOwn.map((u) => (
                        <Link
                          key={u.handle}
                          href={`/u/${u.handle}`}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-neutral-300 transition hover:border-white/25"
                        >
                          {u.name ?? `@${u.handle}`}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {friendsWant.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs uppercase tracking-wide text-neutral-500">
                      Wants it
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {friendsWant.map((u) => (
                        <Link
                          key={u.handle}
                          href={`/u/${u.handle}`}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-neutral-300 transition hover:border-white/25"
                        >
                          {u.name ?? `@${u.handle}`}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
