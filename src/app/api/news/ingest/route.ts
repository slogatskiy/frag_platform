import { NextResponse } from "next/server";
import { ingestNews } from "@/lib/news";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Тянет свежие новости из RSS-лент и апсертит. Идемпотентно.
// Вызывается вручную и по крону (vercel.json). Опц. защита ?key=CRON_SECRET.
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(req.url);
    const key = url.searchParams.get("key") ?? req.headers.get("authorization")?.replace("Bearer ", "");
    if (key !== secret) return NextResponse.json({ ok: false }, { status: 401 });
  }
  const result = await ingestNews();
  return NextResponse.json({ ok: true, ...result });
}

export const GET = run;
export const POST = run;
