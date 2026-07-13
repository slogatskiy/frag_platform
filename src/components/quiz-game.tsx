"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Q = {
  id: string;
  type: "brand" | "note" | "price";
  prompt: string;
  media: { img: string; label: string; slug: string }[];
  options: string[];
  correct: number;
};

export function QuizGame() {
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setQuestions(null);
    setI(0);
    setPicked(null);
    setScore(0);
    setStreak(0);
    setBest(0);
    try {
      const r = await fetch("/api/quiz", { cache: "no-store" });
      const d = await r.json();
      setQuestions(d.questions ?? []);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !questions) {
    return <div className="py-20 text-center text-neutral-500">Loading quiz…</div>;
  }
  if (questions.length === 0) {
    return (
      <div className="py-20 text-center text-neutral-400">
        Couldn&apos;t build a quiz right now.{" "}
        <button onClick={load} className="text-amber-300 hover:text-amber-200">
          Retry
        </button>
      </div>
    );
  }

  const done = i >= questions.length;

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const verdict =
      pct >= 80 ? "Fragrance connoisseur 👑" : pct >= 50 ? "Solid nose 👃" : "Keep sniffing 🧪";
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
        <div className="text-sm uppercase tracking-wide text-neutral-500">Your score</div>
        <div className="mt-2 font-display text-6xl font-semibold text-amber-300">
          {score}
          <span className="text-2xl text-neutral-600">/{questions.length}</span>
        </div>
        <div className="mt-2 text-neutral-300">{verdict}</div>
        <div className="mt-1 text-sm text-neutral-500">Best streak: {best}</div>
        <button
          onClick={load}
          className="mt-8 w-full rounded-full bg-neutral-100 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white"
        >
          Play again
        </button>
        <Link
          href="/catalog"
          className="mt-3 block text-sm text-neutral-500 transition hover:text-neutral-300"
        >
          Browse catalog →
        </Link>
      </div>
    );
  }

  const q = questions[i];
  const answered = picked !== null;

  function choose(idx: number) {
    if (answered) return;
    setPicked(idx);
    if (idx === q.correct) {
      setScore((s) => s + 1);
      setStreak((s) => {
        const ns = s + 1;
        setBest((b) => Math.max(b, ns));
        return ns;
      });
    } else {
      setStreak(0);
    }
  }
  function next() {
    setPicked(null);
    setI((n) => n + 1);
  }

  const optClass = (idx: number) => {
    if (!answered)
      return "border-white/12 bg-white/[0.03] hover:border-amber-400/40 hover:bg-white/[0.06]";
    if (idx === q.correct) return "border-emerald-400/50 bg-emerald-500/15 text-emerald-200";
    if (idx === picked) return "border-rose-400/50 bg-rose-500/15 text-rose-200";
    return "border-white/10 bg-white/[0.02] text-neutral-500";
  };

  return (
    <div className="mx-auto max-w-xl">
      {/* progress + score */}
      <div className="flex items-center justify-between text-sm text-neutral-500">
        <span>
          Question {i + 1} / {questions.length}
        </span>
        <span>
          Score <span className="font-semibold text-amber-300">{score}</span>
          {streak >= 2 && <span className="ml-2 text-orange-400">🔥 {streak}</span>}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-amber-400/80 transition-all"
          style={{ width: `${(i / questions.length) * 100}%` }}
        />
      </div>

      <h2 className="mt-6 text-center font-display text-2xl font-semibold">{q.prompt}</h2>

      {q.type === "price" ? (
        // versus: две карточки — клик по той, что дороже
        <div className="mt-6 grid grid-cols-2 gap-4">
          {q.media.map((m, idx) => (
            <button
              key={idx}
              onClick={() => choose(idx)}
              className={`flex flex-col items-center rounded-2xl border p-4 text-center transition ${optClass(idx)}`}
            >
              <img
                src={m.img}
                alt={m.label}
                className="h-40 w-32 rounded-xl border border-white/10 object-cover"
              />
              <div className="mt-3 text-sm font-medium leading-tight">{m.label}</div>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="mt-6 flex justify-center">
            <img
              src={q.media[0].img}
              alt="fragrance"
              className="h-52 w-40 rounded-2xl border border-white/10 object-cover"
            />
          </div>
          {/* name shown for note-quiz (helps), hidden for brand-quiz */}
          {q.type === "note" && (
            <div className="mt-3 text-center text-sm text-neutral-400">{q.media[0].label}</div>
          )}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => choose(idx)}
                className={`rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition ${optClass(idx)}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}

      {answered && (
        <div className="mt-6 flex items-center justify-between">
          <Link
            href={`/fragrance/${q.type === "price" ? q.media[q.correct].slug : q.media[0].slug}`}
            className="text-sm text-neutral-500 transition hover:text-neutral-300"
          >
            {picked === q.correct ? "Correct! " : "See it "}→
          </Link>
          <button
            onClick={next}
            className="rounded-full bg-neutral-100 px-6 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-white"
          >
            {i + 1 >= questions.length ? "See result" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}
