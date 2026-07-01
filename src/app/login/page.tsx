"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;

  async function signInWithGoogle() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) setError(error.message);
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-white/10 bg-neutral-900/60 p-8 shadow-2xl backdrop-blur-xl">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Sign in to Frag
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Start tracking your shelf and its value.
          </p>

          {sent ? (
            <div className="mt-8 rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4 text-sm text-emerald-300">
              Check your inbox — we sent a magic link to{" "}
              <span className="font-medium">{email}</span>.
            </div>
          ) : (
            <>
              <button
                onClick={signInWithGoogle}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white"
              >
                Continue with Google
              </button>

              <div className="my-6 flex items-center gap-3 text-xs text-neutral-600">
                <div className="h-px flex-1 bg-white/10" />
                or
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={signInWithEmail} className="space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:border-white/25 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-neutral-200 transition hover:border-white/30 disabled:opacity-50"
                >
                  {loading ? "Sending…" : "Email me a magic link"}
                </button>
              </form>
            </>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}
        </div>
      </div>
    </main>
  );
}
