import Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// AI-подбор аромата по настроению/поводу. Два этапа через Claude:
//  1) интерпретируем запрос → ноты + фильтры (structured output);
//  2) матчим по нотам в БД, отдаём кандидатов Claude → топ-6 + причина под каждый.

const MODEL = "claude-opus-4-8";

export type ScentPick = {
  slug: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  retailPrice: number | null;
  priceEstimated: boolean;
  reason: string;
};

export type ScentAiResult =
  | { ok: true; summary: string; picks: ScentPick[] }
  | { ok: false; error: string };

function getClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  return key ? new Anthropic({ apiKey: key }) : null;
}

// Достаём JSON из structured-output ответа.
function parseJson<T>(res: Anthropic.Message): T {
  const text = res.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("no text block");
  return JSON.parse(text.text) as T;
}

const STAGE1_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    notes: {
      type: "array",
      items: { type: "string" },
      description:
        "5-10 fragrance notes matching the vibe, capitalized as on Fragrantica (e.g. 'Vanilla', 'Bergamot', 'Oud', 'Sea Notes').",
    },
    maxPrice: {
      type: ["integer", "null"],
      description: "Max USD price if the user mentioned a budget, else null.",
    },
    summary: {
      type: "string",
      description: "One warm sentence interpreting what they're after.",
    },
  },
  required: ["notes", "maxPrice", "summary"],
} as const;

const STAGE2_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    picks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          slug: { type: "string" },
          reason: {
            type: "string",
            description: "One short, specific sentence on why it fits the request.",
          },
        },
        required: ["slug", "reason"],
      },
    },
  },
  required: ["picks"],
} as const;

type Candidate = {
  slug: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  retailPrice: unknown;
  priceEstimated: boolean;
};

export async function scentRecommend(rawQuery: string): Promise<ScentAiResult> {
  const client = getClient();
  if (!client) {
    return { ok: false, error: "AI isn't configured yet — add an ANTHROPIC_API_KEY to enable it." };
  }
  const query = rawQuery.trim().slice(0, 500);
  if (!query) return { ok: false, error: "Describe a mood, occasion or vibe." };

  // Stage 1 — interpret the vibe into notes + filters.
  const s1 = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system:
      "You are a fragrance expert. Turn the user's mood/occasion into concrete perfume notes and constraints. Be evocative but precise.",
    messages: [{ role: "user", content: query }],
    output_config: { format: { type: "json_schema", schema: STAGE1_SCHEMA } },
  });
  const { notes, maxPrice, summary } = parseJson<{
    notes: string[];
    maxPrice: number | null;
    summary: string;
  }>(s1);

  if (!notes?.length) return { ok: false, error: "Couldn't read that — try describing a scent, mood or occasion." };

  // Match candidates by note overlap (photo-first, then popularity).
  const priceClause = maxPrice
    ? Prisma.sql`AND f."retailPrice" <= ${maxPrice}`
    : Prisma.empty;
  const candidates = await prisma.$queryRaw<Candidate[]>(Prisma.sql`
    SELECT f.slug, f.name, b.name AS brand, f."imageUrl",
           f."retailPrice", f."priceEstimated"
    FROM "Fragrance" f
    JOIN "Brand" b ON f."brandId" = b.id
    WHERE (f."notesTop" || f."notesHeart" || f."notesBase") && ${notes}::text[]
      ${priceClause}
    ORDER BY (f."imageUrl" IS NOT NULL) DESC, f.popularity DESC
    LIMIT 24
  `);

  if (candidates.length === 0) {
    return { ok: false, error: "No matches for that vibe yet — try different words." };
  }

  // Stage 2 — Claude ranks the candidates and explains each pick.
  const menu = candidates
    .map((c) => `${c.slug} | ${c.brand} — ${c.name}`)
    .join("\n");
  const s2 = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system:
      "Pick the 6 best fragrances from the candidate list for the user's request. Use only slugs from the list. Give each a short, specific reason tied to their request.",
    messages: [
      { role: "user", content: `Request: "${query}"\n\nCandidates (slug | brand — name):\n${menu}` },
    ],
    output_config: { format: { type: "json_schema", schema: STAGE2_SCHEMA } },
  });
  const { picks } = parseJson<{ picks: { slug: string; reason: string }[] }>(s2);

  const bySlug = new Map(candidates.map((c) => [c.slug, c]));
  const result: ScentPick[] = [];
  for (const p of picks) {
    const c = bySlug.get(p.slug);
    if (!c) continue;
    result.push({
      slug: c.slug,
      name: c.name,
      brand: c.brand,
      imageUrl: c.imageUrl,
      retailPrice: c.retailPrice != null ? Number(c.retailPrice) : null,
      priceEstimated: c.priceEstimated,
      reason: p.reason,
    });
  }

  if (result.length === 0) return { ok: false, error: "Couldn't rank matches — try again." };
  return { ok: true, summary, picks: result };
}
