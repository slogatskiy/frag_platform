import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { fmtUsd } from "@/lib/valuation";
import { removeFromWishlist } from "@/app/actions/wishlist";
import { addToCollection } from "@/app/actions/collection";
import { BottleThumb } from "@/components/bottle-thumb";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const items = await prisma.wishlistItem.findMany({
    where: { userId: me.id },
    include: { fragrance: { include: { brand: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Wishlist
        </h1>
        <p className="mt-3 max-w-md text-neutral-400">
          Fragrances you&apos;re after. Price-drop alerts are coming here soon.
        </p>

        {items.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center">
            <div className="font-display text-2xl">Your wishlist is empty</div>
            <p className="mx-auto mt-3 max-w-sm text-neutral-400">
              Tap the heart on any fragrance in the catalog to save it here.
            </p>
            <Link
              href="/catalog"
              className="mt-6 inline-block rounded-full bg-neutral-100 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white"
            >
              Browse catalog
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((w) => (
              <div
                key={w.id}
                className="flex flex-col rounded-2xl border border-white/8 bg-white/[0.02] p-5"
              >
                <div className="flex items-start gap-4">
                  <BottleThumb
                    imageUrl={w.fragrance.imageUrl}
                    brand={w.fragrance.brand.name}
                    className="h-16 w-12 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-amber-300/70">
                      {w.fragrance.brand.name}
                    </div>
                    <div className="mt-1 font-display text-lg font-semibold leading-snug">
                      {w.fragrance.name}
                    </div>
                    {w.fragrance.retailPrice != null && (
                      <div className="mt-1 text-sm text-neutral-400">
                        ~{fmtUsd(Number(w.fragrance.retailPrice))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <form
                    className="flex-1"
                    action={async () => {
                      "use server";
                      await addToCollection(w.fragrance.id);
                      await removeFromWishlist(w.fragrance.id);
                    }}
                  >
                    <button className="w-full rounded-full border border-white/12 py-2 text-sm font-medium text-neutral-300 transition hover:border-white/25 hover:bg-white/5">
                      I bought it →
                    </button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await removeFromWishlist(w.fragrance.id);
                    }}
                  >
                    <button
                      aria-label="remove"
                      className="rounded-full border border-white/12 px-3 py-2 text-sm text-neutral-500 transition hover:text-red-400"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
