import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { POPULAR_NOTES } from "@/lib/notes";

export const dynamic = "force-dynamic";

type PoolRow = {
  id: string;
  name: string;
  slug: string;
  img: string;
  brand: string;
  price: string | null;
  notes: string[] | null;
};

// media: [{img,label}] — 1 элемент для brand/note, 2 для price
export type QuizQuestion = {
  id: string;
  type: "brand" | "note" | "price";
  prompt: string;
  media: { img: string; label: string; slug: string }[];
  options: string[];
  correct: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export async function GET() {
  const pool = await prisma.$queryRawUnsafe<PoolRow[]>(
    `SELECT f.id, f.name, f.slug, f."imageUrl" AS img, b.name AS brand,
            f."retailPrice"::text AS price,
            (f."notesTop" || f."notesHeart" || f."notesBase") AS notes
     FROM "Fragrance" f JOIN "Brand" b ON b.id = f."brandId"
     WHERE f."imageUrl" IS NOT NULL
     ORDER BY random() LIMIT 80`
  );

  const brands = [...new Set(pool.map((r) => r.brand))];
  const questions: QuizQuestion[] = [];
  const used = new Set<string>();
  const take = (pred: (r: PoolRow) => boolean) =>
    pool.find((r) => !used.has(r.id) && pred(r));

  // 3 «угадай бренд»
  for (let i = 0; i < 3; i++) {
    const r = take((x) => brands.length >= 4 && !!x.brand);
    if (!r) break;
    used.add(r.id);
    const distractors = shuffle(brands.filter((b) => b !== r.brand)).slice(0, 3);
    const options = shuffle([r.brand, ...distractors]);
    questions.push({
      id: r.id,
      type: "brand",
      prompt: "Which house makes it?",
      media: [{ img: r.img, label: r.name, slug: r.slug }],
      options,
      correct: options.indexOf(r.brand),
    });
  }

  // 3 «угадай ноту»
  for (let i = 0; i < 3; i++) {
    const r = take((x) => !!x.notes && x.notes.length > 0);
    if (!r) break;
    used.add(r.id);
    const own = new Set((r.notes ?? []).map((n) => n.toLowerCase()));
    const real = pick(r.notes!);
    const fakes = shuffle(
      POPULAR_NOTES.filter((n) => !own.has(n.toLowerCase()))
    ).slice(0, 3);
    if (fakes.length < 3) continue;
    const options = shuffle([real, ...fakes]);
    questions.push({
      id: r.id,
      type: "note",
      prompt: "Which note is in it?",
      media: [{ img: r.img, label: r.name, slug: r.slug }],
      options,
      correct: options.indexOf(real),
    });
  }

  // 2 «что дороже»
  for (let i = 0; i < 2; i++) {
    const a = take((x) => x.price != null);
    if (a) used.add(a.id);
    const b = take((x) => x.price != null && a != null && x.id !== a.id);
    if (!a || !b) break;
    used.add(b.id);
    const pa = Number(a.price),
      pb = Number(b.price);
    if (pa === pb) continue;
    questions.push({
      id: `${a.id}-${b.id}`,
      type: "price",
      prompt: "Which one is pricier?",
      media: [
        { img: a.img, label: a.name, slug: a.slug },
        { img: b.img, label: b.name, slug: b.slug },
      ],
      options: [a.name, b.name],
      correct: pa > pb ? 0 : 1,
    });
  }

  return NextResponse.json({ questions: shuffle(questions) });
}
