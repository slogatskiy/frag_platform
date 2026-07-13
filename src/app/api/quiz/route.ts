import { NextResponse } from "next/server";
import { generateQuestions } from "@/lib/quiz";

export const dynamic = "force-dynamic";

export async function GET() {
  const questions = await generateQuestions();
  return NextResponse.json({ questions });
}
