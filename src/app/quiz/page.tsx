import type { Metadata } from "next";
import { QuizGame } from "@/components/quiz-game";

export const metadata: Metadata = {
  title: "Fragrance Quiz — Frag",
  description: "Test your nose: guess the house, the notes and the price. How many can you get?",
};

export default function QuizPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            Fragrance Quiz
          </h1>
          <p className="mt-2 text-neutral-500">
            Guess the house, the notes, and the pricier bottle. Are you a real nose?
          </p>
        </div>
        <div className="mt-10">
          <QuizGame />
        </div>
      </div>
    </main>
  );
}
