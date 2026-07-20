"use client";

import { useState } from "react";
import Link from "next/link";
import { BottleThumb } from "@/components/bottle-thumb";
import type { ScentPick } from "@/lib/scent-ai";

const EXAMPLES = [
  "Warm and cozy for winter date nights, under $150",
  "Fresh clean office scent that isn't boring",
  "Something that smells like a beach vacation",
  "A bold, smoky signature for going out",
];

export function ScentAi() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [picks, setPicks] = useState<ScentPick[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(q: string) {
    const text = q.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    setPicks(null);
    setSummary(null);
    try {
      const res = await fetch("/api/scent-ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = await res.json();
      if (!data.ok) setError(data.error ?? "Something went wrong.");
      else {
        setSummary(data.summary);
        setPicks(data.picks);
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(query);
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe a mood, occasion or vibe…"
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-neutral-100 placeholder:text-neutral-600 focus:border-amber-400/40 focus:outline-none"
          />
          <button
            disabled={loading || !query.trim()}
            className="rounded-2xl bg-neutral-100 px-6 py-4 text-sm font-semibold text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Thinking…" : "✨ Find my scent"}
          </button>
        </div>
      </form>

      {!picks && !loading && (
        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setQuery(ex);
                run(ex);
              }}
              className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-neutral-400 transition hover:border-amber-300/40 hover:text-amber-200"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="mt-8 animate-pulse text-sm text-neutral-500">
          Reading the vibe and matching notes across 59,000 fragrances…
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] px-5 py-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {summary && (
        <p className="mt-8 font-display text-xl leading-snug text-neutral-100">{summary}</p>
      )}

      {picks && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {picks.map((p) => (
            <Link
              key={p.slug}
              href={`/fragrance/${p.slug}`}
              className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/25"
            >
              <BottleThumb imageUrl={p.imageUrl} brand={p.brand} className="h-24 w-18 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-amber-300/70">{p.brand}</div>
                <div className="font-display text-lg font-semibold leading-tight">{p.name}</div>
                {p.retailPrice != null && (
                  <div className="mt-0.5 text-sm text-neutral-500">
                    {p.priceEstimated ? "~" : ""}${p.retailPrice}
                  </div>
                )}
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-300">{p.reason}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
