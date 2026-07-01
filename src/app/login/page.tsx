"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) return setError(error.message);
      if (!data.session) {
        // Подтверждение email всё ещё включено в Supabase.
        return setInfo(
          "Account created. Email confirmation is still ON in Supabase — turn it off (Authentication → Providers → Email) so you can sign in instantly."
        );
      }
      router.push("/shelf");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) return setError(error.message);
      router.push("/shelf");
      router.refresh();
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-white/10 bg-neutral-900/60 p-8 shadow-2xl backdrop-blur-xl">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {mode === "signup" ? "Create your shelf" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            {mode === "signup"
              ? "Sign up to start tracking your collection."
              : "Sign in to your Frag account."}
          </p>

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

          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:border-white/25 focus:outline-none"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 chars)"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:border-white/25 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-neutral-200 transition hover:border-white/30 disabled:opacity-50"
            >
              {loading
                ? "…"
                : mode === "signup"
                ? "Create account"
                : "Sign in"}
            </button>
          </form>

          <button
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setError(null);
              setInfo(null);
            }}
            className="mt-5 w-full text-center text-sm text-neutral-500 transition hover:text-neutral-300"
          >
            {mode === "signup"
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          {info && <p className="mt-4 text-sm text-amber-300">{info}</p>}
        </div>
      </div>
    </main>
  );
}
