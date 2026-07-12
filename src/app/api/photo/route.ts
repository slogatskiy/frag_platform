import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchFragranceImage } from "@/lib/scrape-photo";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

// On-demand дозагрузка фото аромата: если у аромата нет фото, но есть sourceUrl —
// тянем с источника, валидируем, сохраняем. Вызывается клиентом при открытии карточки.
export async function POST(req: Request) {
  let fragranceId = "";
  try {
    const body = await req.json();
    fragranceId = String(body?.fragranceId ?? "");
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!fragranceId) return NextResponse.json({ ok: false }, { status: 400 });

  const f = await prisma.fragrance.findUnique({
    where: { id: fragranceId },
    select: { id: true, name: true, imageUrl: true, sourceUrl: true, slug: true },
  });
  if (!f) return NextResponse.json({ ok: false }, { status: 404 });

  // Уже есть фото или нечего тянуть
  if (f.imageUrl) return NextResponse.json({ ok: true, url: f.imageUrl });
  if (!f.sourceUrl) return NextResponse.json({ ok: false });

  const img = await fetchFragranceImage(f.sourceUrl, f.name);
  if (!img) return NextResponse.json({ ok: false });

  await prisma.fragrance.update({
    where: { id: f.id },
    data: { imageUrl: img },
  });

  return NextResponse.json({ ok: true, url: img });
}
