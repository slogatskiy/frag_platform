import Link from "next/link";

export function SiteHeader() {
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
          <Link href="/catalog" className="transition hover:text-neutral-100">
            How it works
          </Link>
        </nav>

        <Link
          href="/catalog"
          className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-white"
        >
          Start your shelf
        </Link>
      </div>
    </header>
  );
}
