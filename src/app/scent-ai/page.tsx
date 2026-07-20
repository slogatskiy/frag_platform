import type { Metadata } from "next";
import { ScentAi } from "@/components/scent-ai";

export const metadata: Metadata = {
  title: "Scent AI — Frag",
  description: "Describe a mood or occasion and get fragrance recommendations from 59,000+ scents.",
};

export default function ScentAiPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/70">
          Powered by Claude
        </div>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">Scent AI</h1>
        <p className="mt-2 text-neutral-400">
          Tell it a mood, a memory, an occasion — it reads the vibe, matches notes across the whole
          catalog, and explains why each pick fits.
        </p>

        <div className="mt-8">
          <ScentAi />
        </div>
      </div>
    </main>
  );
}
