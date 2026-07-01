import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/actions/collection";

export async function SiteHeader() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
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
          {user && (
            <Link href="/shelf" className="transition hover:text-neutral-100">
              My Shelf
            </Link>
          )}
        </nav>

        {user ? (
          <div className="flex items-center gap-4">
            <Link
              href="/shelf"
              className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-white"
            >
              My Shelf
            </Link>
            <form action={signOut}>
              <button className="text-sm text-neutral-500 transition hover:text-neutral-200">
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-white"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
