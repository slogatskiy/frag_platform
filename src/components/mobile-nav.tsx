"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { signOut } from "@/app/actions/collection";

type NavUser = { handle: string; name: string | null; avatarUrl: string | null };

const PUBLIC_LINKS = [
  { href: "/catalog", label: "Catalog" },
  { href: "/discover", label: "Discover" },
  { href: "/scent-ai", label: "Scent AI" },
  { href: "/news", label: "News" },
];

const USER_LINKS = [
  { href: "/feed", label: "Feed" },
  { href: "/battles", label: "Battles" },
  { href: "/shelf", label: "My Shelf" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/friends", label: "Friends" },
];

// Мобильное меню (бургер → выезжающая панель). Десктоп-нав скрыт на телефоне,
// поэтому без этого с мобилы вообще не было навигации.
export function MobileNav({ user, battleTurns }: { user: NavUser | null; battleTurns: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        aria-label="Menu"
        onClick={() => setOpen(true)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-neutral-200 transition hover:border-white/25"
      >
        <span className="text-lg">☰</span>
        {battleTurns > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-neutral-900">
            {battleTurns}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85%] flex-col border-l border-white/10 bg-neutral-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-display text-xl font-semibold">Frag</span>
              <button
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="text-neutral-500 transition hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            {user && (
              <Link
                href={`/u/${user.handle}`}
                onClick={() => setOpen(false)}
                className="mt-6 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3"
              >
                <Avatar name={user.name} handle={user.handle} avatarUrl={user.avatarUrl} size="md" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{user.name ?? `@${user.handle}`}</div>
                  <div className="truncate text-xs text-neutral-500">View profile</div>
                </div>
              </Link>
            )}

            <nav className="mt-6 flex flex-col gap-1 text-[15px]">
              {PUBLIC_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-neutral-300 transition hover:bg-white/5 hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
              {user &&
                USER_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-neutral-300 transition hover:bg-white/5 hover:text-white"
                  >
                    {l.label}
                    {l.href === "/battles" && battleTurns > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-bold text-neutral-900">
                        {battleTurns}
                      </span>
                    )}
                  </Link>
                ))}
            </nav>

            <div className="mt-auto pt-6">
              {user ? (
                <form action={signOut}>
                  <button className="w-full rounded-full border border-white/15 py-2.5 text-sm font-semibold text-neutral-300 transition hover:border-white/30">
                    Sign out
                  </button>
                </form>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-full bg-neutral-100 py-2.5 text-center text-sm font-semibold text-neutral-900 transition hover:bg-white"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
