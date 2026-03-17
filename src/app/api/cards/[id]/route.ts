import { NextResponse } from "next/server";
import { getCard } from "@/lib/storage/cards";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const card = await getCard(id);
    if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(card);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fetch failed" },
      { status: 500 },
    );
  }
}

