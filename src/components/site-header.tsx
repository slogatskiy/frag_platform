import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/avatar";
import { MobileNav } from "@/components/mobile-nav";
import { signOut } from "@/app/actions/collection";

export async function SiteHeader() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  // Сколько баттлов ждут моего хода
  let battleTurns = 0;
  if (user) {
    try {
      battleTurns = await prisma.battle.count({
        where: {
          OR: [
            { opponentId: user.id, opponentScore: null },
            { challengerId: user.id, challengerScore: null },
          ],
        },
      });
    } catch {
      battleTurns = 0;
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-neutral-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-semibold tracking-tight">
            Frag
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-neutral-400 sm:flex">
          <Link href="/catalog" className="transition hover:text-neutral-100">
            Catalog
          </Link>
          <Link href="/discover" className="transition hover:text-neutral-100">
            Discover
          </Link>
          <Link href="/scent-ai" className="transition hover:text-amber-200">
            Scent AI
          </Link>
          <Link href="/quiz" className="transition hover:text-neutral-100">
            Quiz
          </Link>
          <Link href="/news" className="transition hover:text-neutral-100">
            News
          </Link>
          {user && (
            <>
              <Link href="/feed" className="transition hover:text-neutral-100">
                Feed
              </Link>
              <Link href="/battles" className="relative transition hover:text-neutral-100">
                Battles
                {battleTurns > 0 && (
                  <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-neutral-900">
                    {battleTurns}
                  </span>
                )}
              </Link>
              <Link href="/shelf" className="transition hover:text-neutral-100">
                My Shelf
              </Link>
              <Link href="/portfolio" className="transition hover:text-neutral-100">
                Portfolio
              </Link>
              <Link href="/wishlist" className="transition hover:text-neutral-100">
                Wishlist
              </Link>
              <Link href="/friends" className="transition hover:text-neutral-100">
                Friends
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/shelf"
                className="hidden rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-white sm:inline-block"
              >
                My Shelf
              </Link>
              <Link
                href={`/u/${user.handle}`}
                title="Your profile"
                className="hidden transition hover:opacity-80 sm:block"
              >
                <Avatar name={user.name} handle={user.handle} avatarUrl={user.avatarUrl} size="sm" />
              </Link>
              <form action={signOut} className="hidden sm:block">
                <button className="text-sm text-neutral-500 transition hover:text-neutral-200">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-white sm:inline-block"
            >
              Sign in
            </Link>
          )}

          <MobileNav
            user={user ? { handle: user.handle, name: user.name, avatarUrl: user.avatarUrl } : null}
            battleTurns={battleTurns}
          />
        </div>
      </div>
    </header>
  );
}
